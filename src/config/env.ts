// Production-safe configuration loader. Fails closed: in production the
// process refuses to boot with missing/weak secrets or the legacy dev secret.
import dotenv from "dotenv";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

const LEGACY_DEV_SECRET = "super_secret_dev_key";
const MIN_SECRET_LENGTH = 32;

function readSecret(name: string, devFallback: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    if (isProd) {
      throw new Error(`[config] ${name} is required in production.`);
    }
    console.warn(
      `[config] ${name} not set; using an insecure development fallback. Do NOT use in production.`,
    );
    return devFallback;
  }

  if (value === LEGACY_DEV_SECRET) {
    if (isProd) {
      throw new Error(
        `[config] ${name} must not use the legacy dev secret in production.`,
      );
    }
    console.warn(`[config] ${name} is the legacy dev secret. Replace it.`);
  }

  if (isProd && value.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `[config] ${name} must be at least ${MIN_SECRET_LENGTH} characters in production.`,
    );
  }

  return value;
}

function parseOrigins(raw: string | undefined): string[] {
  if (!raw || raw.trim() === "") return [];
  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

const corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? parseOrigins(process.env.CORS_ALLOWED_ORIGINS)
  : ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"];
if (isProd && corsAllowedOrigins.length === 0) {
  throw new Error(
    "[config] CORS_ALLOWED_ORIGINS must list at least one origin in production.",
  );
}

export const config = {
  isProd,
  port: Number(process.env.PORT) || 3000,
  jwt: {
    accessSecret: readSecret("JWT_ACCESS_SECRET", "dev-access-secret"),
    refreshSecret: readSecret("JWT_REFRESH_SECRET", "dev-refresh-secret"),
    accessTtl: process.env.JWT_ACCESS_TTL || "15m",
    refreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS) || 7,
    issuer: process.env.JWT_ISSUER || "technetics-platform",
    audience: process.env.JWT_AUDIENCE || "technetics-clients",
  },
  cors: {
    allowedOrigins: corsAllowedOrigins,
  },
  cookie: {
    domain: process.env.COOKIE_DOMAIN || undefined,
    // Secure cookies always on in prod; off in local http dev.
    secure: isProd,
    name: "technetics_refresh",
  },
  enableDevToken: process.env.ENABLE_DEV_TOKEN !== "false",
} as const;
