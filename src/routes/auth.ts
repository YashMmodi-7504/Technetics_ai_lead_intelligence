// DEMO-MODE authentication.
//
// There are no real user accounts: any email + any password authenticates as a
// single demo admin user. We still mint a real JWT access token (existing JWT
// infrastructure) so every protected route keeps working unchanged, and we set
// a lightweight httpOnly cookie holding the demo email so a page refresh
// silently re-issues a token (session persistence) — no users table, no
// refresh-token table, no registration required.
import { Router } from "express";
import { config } from "../config/env.js";
import { signAccessToken } from "../services/tokens.js";

const router = Router();
const SESSION_COOKIE = config.cookie.name;

interface DemoUser {
  id: number;
  email: string;
  role: "admin";
}

function demoUser(email?: unknown): DemoUser {
  const clean = typeof email === "string" && email.trim() ? email.trim() : "demo@technetics.ai";
  return { id: 1, email: clean, role: "admin" };
}

function sessionCookieOptions() {
  // Frontend (Vercel) and API (Railway) are on different domains, so the cookie
  // must be cross-site capable: SameSite=None requires Secure. In local http dev
  // (secure=false) fall back to Lax, since browsers reject SameSite=None there.
  const crossSite = config.cookie.secure;
  return {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: (crossSite ? "none" : "lax") as "none" | "lax",
    domain: config.cookie.domain,
    path: "/api/auth",
    maxAge: config.jwt.refreshTtlDays * 24 * 60 * 60 * 1000,
  };
}

// Issue a demo session: real JWT access token + a cookie marking the session.
function issueDemoSession(res: import("express").Response, email?: unknown) {
  const user = demoUser(email);
  const accessToken = signAccessToken({ id: user.id, email: user.email });
  res.cookie(SESSION_COOKIE, encodeURIComponent(user.email), sessionCookieOptions());
  return { accessToken, user };
}

// Any email + any password succeeds. No validation errors, no "Login Failed".
router.post("/login", (req, res) => {
  const { accessToken, user } = issueDemoSession(res, req.body?.email);
  res.json({ accessToken, user });
});

// Registration is not required in demo mode; the endpoint stays for the existing
// UI and simply creates the same demo session.
router.post("/register", (req, res) => {
  const { accessToken, user } = issueDemoSession(res, req.body?.email);
  res.status(201).json({ accessToken, user });
});

// Page refresh: if a demo session cookie exists, re-issue a token (keeps the
// user authenticated across reloads). Otherwise 401 so the login screen shows.
router.post("/refresh", (req, res) => {
  const raw = req.cookies?.[SESSION_COOKIE];
  if (!raw) {
    res.status(401).json({ error: "No active session" });
    return;
  }
  let email = "demo@technetics.ai";
  try {
    email = decodeURIComponent(raw);
  } catch {
    /* malformed cookie → fall back to default demo email */
  }
  const { accessToken, user } = issueDemoSession(res, email);
  res.json({ accessToken, user });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE, sessionCookieOptions());
  res.status(204).end();
});

// Kept for the local-dev auto-login button; issues the same demo session.
router.all("/dev-token", (_req, res) => {
  const { accessToken, user } = issueDemoSession(res, "demo@technetics.ai");
  res.json({ token: accessToken, accessToken, user });
});

export default router;
