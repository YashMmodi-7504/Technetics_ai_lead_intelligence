// Stricter rate limiter for auth endpoints (brute-force / credential stuffing
// protection), plus a relaxed global limiter mounted in server.ts.
import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
  skip: (req) => {
    if (process.env.NODE_ENV !== "production") {
      return req.originalUrl.includes("/dev-token") || req.path.includes("/dev-token");
    }
    return false;
  },
});

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});
