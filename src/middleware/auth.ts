import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/tokens.js";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing token" });
    return;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
