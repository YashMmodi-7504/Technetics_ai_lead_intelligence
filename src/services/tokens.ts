// JWT access tokens + rotating refresh-token strategy.
//
// Access tokens are short-lived and verified on every request. Refresh tokens
// are long-lived, stored HASHED in the DB (so a DB leak can't be replayed),
// delivered via an httpOnly secure cookie, and rotated on every refresh.
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { refreshTokens } from "../db/schema.js";
import { config } from "../config/env.js";

export interface AccessClaims {
  id: number;
  email: string;
}

export function signAccessToken(claims: AccessClaims): string {
  const options: jwt.SignOptions = {
    expiresIn: config.jwt.accessTtl as jwt.SignOptions["expiresIn"],
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  };
  return jwt.sign(claims, config.jwt.accessSecret, options);
}

export function verifyAccessToken(token: string): AccessClaims {
  return jwt.verify(token, config.jwt.accessSecret, {
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  }) as AccessClaims;
}

// Opaque random refresh token; only its SHA-256 hash is persisted.
function generateRefreshTokenValue(): string {
  return crypto.randomBytes(48).toString("base64url");
}

export function hashToken(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function issueRefreshToken(userId: number): Promise<string> {
  const value = generateRefreshTokenValue();
  const expiresAt = new Date(
    Date.now() + config.jwt.refreshTtlDays * 24 * 60 * 60 * 1000,
  );
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(value),
    expiresAt,
  });
  return value;
}

export interface RotateResult {
  userId: number;
  refreshValue: string;
}

// Validate a presented refresh token, revoke it, and issue a fresh one
// (rotation). Returns null if the token is unknown, revoked or expired.
// On reuse of an already-revoked token, revokes all of the user's tokens
// (family revocation) as a theft mitigation.
export async function rotateRefreshToken(
  presentedValue: string,
): Promise<RotateResult | null> {
  const tokenHash = hashToken(presentedValue);
  const rows = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);

  const existing = rows[0];
  if (!existing) return null;

  if (existing.revokedAt) {
    // Reuse of a revoked token => likely theft. Revoke the whole family.
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.userId, existing.userId));
    return null;
  }

  if (existing.expiresAt.getTime() < Date.now()) {
    return null;
  }

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, existing.id));

  const refreshValue = await issueRefreshToken(existing.userId);
  return { userId: existing.userId, refreshValue };
}

export async function revokeRefreshToken(
  presentedValue: string,
): Promise<void> {
  const tokenHash = hashToken(presentedValue);
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}
