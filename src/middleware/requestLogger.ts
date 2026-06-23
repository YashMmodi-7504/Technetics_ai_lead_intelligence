import type { Request, Response, NextFunction } from "express";

interface LogEntry {
  ts: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  ip: string;
}

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  res.on("finish", () => {
    const entry: LogEntry = {
      ts: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - start,
      ip:
        (req.headers["x-forwarded-for"] as string | undefined)
          ?.split(",")[0]
          ?.trim() ??
        req.socket.remoteAddress ??
        "unknown",
    };
    console.log(JSON.stringify(entry));
  });
  next();
}
