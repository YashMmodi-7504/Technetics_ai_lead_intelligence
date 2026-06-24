import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env file.
dotenv.config();

const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
// Prefer admin credentials for migrations; fall back to the runtime SQL user.
const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;

// Match the runtime SSL behaviour (createPool) so managed providers like Neon
// that require TLS connect correctly.
const ssl =
  process.env.SQL_SSL === "false"
    ? false
    : { rejectUnauthorized: process.env.SQL_SSL_REJECT_UNAUTHORIZED !== "false" };

if (!sqlHost) {
  console.warn("SQL_HOST missing, using fallback for generate");
}
if (!sqlDbName) {
  console.warn("SQL_DB_NAME missing, using fallback");
}
if (!user) {
  console.warn("SQL_ADMIN_USER missing, using fallback");
}
if (!password) {
  console.warn("SQL_ADMIN_PASSWORD missing, using fallback");
}
console.log(`Using user: ${user || 'fallback'} to connect to database.`);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle", // Output directory for migrations.
  dialect: "postgresql",
  // schemaFilter: ["public"], // Removed, sometimes causes issues with drizzle-kit parsing
  dbCredentials: {
    host: sqlHost,
    user: user,
    password: password,
    database: sqlDbName,
    ssl,
  },
  verbose: true,
});
