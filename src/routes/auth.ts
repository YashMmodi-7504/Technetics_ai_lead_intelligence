import { Router } from "express";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { config } from "../config/env.js";
import { hashPassword, verifyPassword } from "../services/password.js";
import {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from "../services/tokens.js";

const router = Router();
const REFRESH_COOKIE = config.cookie.name;

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: "strict" as const,
    domain: config.cookie.domain,
    path: "/api/auth",
    maxAge: config.jwt.refreshTtlDays * 24 * 60 * 60 * 1000,
  };
}

async function issueSession(
  res: import("express").Response,
  user: { id: number; email: string },
) {
  const accessToken = signAccessToken({ id: user.id, email: user.email });
  const refreshValue = await issueRefreshToken(user.id);
  res.cookie(REFRESH_COOKIE, refreshValue, refreshCookieOptions());
  return accessToken;
}

router.post("/register", async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const { email, password } = parsed.data;

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const result = await db
      .insert(users)
      .values({ email, passwordHash })
      .returning();
    const user = result[0];

    const accessToken = await issueSession(res, user);
    res.status(201).json({
      accessToken,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error("[auth/register] failed:", error);
    res.status(500).json({ error: "Failed to register" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const { email, password } = parsed.data;

    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const user = result[0];

    const ok = user
      ? await verifyPassword(password, user.passwordHash)
      : await verifyPassword(password, "$2b$12$invalidinvalidinvalidinvalidin");

    if (!user || !ok) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const accessToken = await issueSession(res, user);
    res.json({ accessToken, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error("[auth/login] failed:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const presented = req.cookies?.[REFRESH_COOKIE];
    if (!presented) {
      res.status(401).json({ error: "Missing refresh token" });
      return;
    }
    const rotated = await rotateRefreshToken(presented);
    if (!rotated) {
      res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, rotated.userId))
      .limit(1);
    const user = userRows[0];
    if (!user) {
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }
    res.cookie(REFRESH_COOKIE, rotated.refreshValue, refreshCookieOptions());
    const accessToken = signAccessToken({ id: user.id, email: user.email });
    res.json({ accessToken, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error("[auth/refresh] failed:", error);
    res.status(500).json({ error: "Failed to refresh" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const presented = req.cookies?.[REFRESH_COOKIE];
    if (presented) await revokeRefreshToken(presented);
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
    res.status(204).end();
  } catch (error) {
    console.error("[auth/logout] failed:", error);
    res.status(500).json({ error: "Failed to logout" });
  }
});

router.all("/dev-token", async (_req, res) => {
  if (!config.enableDevToken || config.isProd) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  try {
    const email = "dev@technetics.local";
    let rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!rows.length) {
      rows = await db
        .insert(users)
        .values({ email, passwordHash: await hashPassword("dev-password") })
        .returning();
    }
    const user = rows[0];
    const accessToken = await issueSession(res, user);
    res.json({
      token: accessToken,
      accessToken,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error("[auth/dev-token] failed:", error);
    res.status(500).json({ error: "Failed to issue dev token" });
  }
});

export default router;
