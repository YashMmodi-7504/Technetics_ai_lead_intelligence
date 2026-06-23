import { drizzle as nodePgDrizzle } from "drizzle-orm/node-postgres";
import { drizzle as pgliteDrizzle } from "drizzle-orm/pglite";
import pg from "pg";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema.js";
import * as fs from "fs";
import * as path from "path";
import { hashPassword } from "../services/password.js";

const { Pool } = pg;

export const createPool = () => {
  const sslEnv = process.env.SQL_SSL;
  const ssl =
    sslEnv === "false"
      ? false
      : {
          rejectUnauthorized:
            process.env.SQL_SSL_REJECT_UNAUTHORIZED !== "false",
        };

  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    port: Number(process.env.SQL_PORT) || 5432,
    ssl,
    max: Number(process.env.SQL_POOL_MAX) || 10,
    idleTimeoutMillis: Number(process.env.SQL_IDLE_TIMEOUT_MS) || 30_000,
    connectionTimeoutMillis:
      Number(process.env.SQL_CONNECT_TIMEOUT_MS) || 15_000,
    statement_timeout: Number(process.env.SQL_STATEMENT_TIMEOUT_MS) || 30_000,
  });
};

// When no external SQL_HOST is configured we use PGlite — but persisted to a
// data directory on disk (NOT in memory), so all imported records survive
// server restarts and deployments. Override the location with PGLITE_DATA_DIR;
// set it to ":memory:" only for ephemeral test runs.
const useEmbedded = !process.env.SQL_HOST || process.env.SQL_HOST.trim() === "";
const pgliteDataDir = process.env.PGLITE_DATA_DIR?.trim() || path.join(process.cwd(), ".pgdata");
const embeddedInMemory = pgliteDataDir === ":memory:" || process.env.NODE_ENV === "test";

let dbInstance: any;
let client: PGlite | null = null;

if (useEmbedded) {
  // Persist to disk by default; only fall back to memory for tests.
  client = embeddedInMemory ? new PGlite() : new PGlite({ dataDir: pgliteDataDir });
  dbInstance = pgliteDrizzle(client, { schema });
} else {
  const pool = createPool();
  pool.on("error", (err) => {
    console.error("Unexpected error on idle SQL pool client:", err);
  });
  dbInstance = nodePgDrizzle(pool, { schema });
}

export const db = dbInstance;

export const initializeDb = async () => {
  if (useEmbedded && client) {
    console.log(
      embeddedInMemory
        ? "[db] Using an in-memory PGlite database (ephemeral)."
        : `[db] SQL_HOST not set. Using a persistent PGlite database at ${pgliteDataDir} (survives restarts).`,
    );

    // Skip schema creation if the database is already initialized (persisted).
    let alreadyInitialized = false;
    try {
      const res: any = await client.query("SELECT to_regclass('public.companies') AS t");
      alreadyInitialized = !!res?.rows?.[0]?.t;
    } catch {
      alreadyInitialized = false;
    }

    if (alreadyInitialized) {
      console.log("[db] Existing data found — schema already initialized, skipping migrations.");
    } else {
      // Create tables using drizzle-kit generated DDL
      const migrationDir = path.join(process.cwd(), "drizzle");
      if (fs.existsSync(migrationDir)) {
        const files = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql')).sort();
        for (const file of files) {
          const ddl = fs.readFileSync(path.join(migrationDir, file), "utf-8");
          const statements = ddl.split("--> statement-breakpoint");
          for (const statement of statements) {
            if (statement.trim() !== "") {
              try {
                await client.exec(statement);
              } catch (e) {
                console.warn(`[db] Error in migration ${file}:`, e);
              }
            }
          }
        }
        console.log("[db] Database schema created successfully.");
      } else {
        console.error(`[db] Schema DDL migration directory not found at ${migrationDir}`);
      }
    }

    // 100% CSV-driven: NO mock data of any kind is seeded. Only the dev login
    // user is created so the platform is reachable; all companies, decision
    // makers, and market data come exclusively from CSV uploads.
    try {
      const devPasswordHash = await hashPassword("dev-password");
      await dbInstance
        .insert(schema.users)
        .values({
          email: "dev@technetics.local",
          passwordHash: devPasswordHash,
        })
        .onConflictDoNothing({ target: schema.users.email });
      console.log("[db] Dev user ready. Database is empty — awaiting CSV imports.");
    } catch (err) {
      console.error("[db] Dev user seed failed:", err);
    }
  }
};
