import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { z } from "zod";

import { config } from "./src/config/env.js";
import authRouter from "./src/routes/auth.js";
import crmRouter from "./src/routes/crm.js";
import importRouter from "./src/routes/import.js";
import { initializeDb } from "./src/db/index.js";
import { aiService } from "./src/services/ai/index.js";
import { getGeminiClient } from "./src/services/ai/client.js";
import { authLimiter, globalLimiter } from "./src/middleware/rateLimit.js";
import { requireAuth, type AuthRequest } from "./src/middleware/auth.js";
import { requestLogger } from "./src/middleware/requestLogger.js";
import {
  incrementRequests,
  incrementErrors,
  getMetrics,
} from "./src/services/metrics.js";
import {
  checkAiBudget,
  recordAiUsage,
} from "./src/services/aiCostGovernor.js";

const PORT = config.port;

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (config.cors.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

const generateOutreachBodySchema = z.object({
  companyName: z.string().min(1).max(200),
  industry: z.string().min(1).max(200),
  executiveName: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  channel: z.enum(["linkedin", "email", "followup1", "followup2", "followup3", "proposal"]),
  customPrompt: z.string().max(1000).optional(),
  details: z.string().max(2000).optional(),
  serviceType: z.string().min(1).max(200),
});

const scoreComprehensiveBodySchema = z.object({
  companyName: z.string().min(1).max(200),
  dataScience: z.number().min(0).max(100).optional(),
  powerBI: z.number().min(0).max(100).optional(),
  cloud: z.number().min(0).max(100).optional(),
  automation: z.number().min(0).max(100).optional(),
  buyingIntent: z.number().min(0).max(100).optional(),
});

async function startServer() {
  await initializeDb();
  const app = express();

  if (process.env.NODE_ENV === "production") {
    app.use(helmet());
  }
  app.use(cors(corsOptions));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(requestLogger);
  app.use((_req, _res, next) => {
    incrementRequests();
    next();
  });
  app.use("/api", globalLimiter);

  app.use("/api/auth", authLimiter, authRouter);
  app.use("/api/crm", crmRouter);
  app.use("/api/import", importRouter);

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      serverTime: new Date().toISOString(),
      geminiConnected: !!getGeminiClient(),
      hasKeySecret: !!process.env.GEMINI_API_KEY,
      metrics: getMetrics(),
    });
  });

  app.post("/api/generate-outreach", requireAuth, async (req: AuthRequest, res) => {
    const budget = checkAiBudget(req.user!.id);
    if (!budget.allowed) {
      res.status(429).json({ error: budget.reason });
      return;
    }
    const parsed = generateOutreachBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    try {
      const result = await aiService.generateOutreach(parsed.data);
      recordAiUsage(req.user!.id, result.usage.totalTokens);
      res.json({
        success: true,
        content: result.data.content,
        provider:
          result.provider === "gemini"
            ? "Gemini AI"
            : "Technetics Dynamic Fallback Engine",
        timestamp: result.timestamp,
      });
    } catch (err) {
      incrementErrors();
      console.error("[/api/generate-outreach] failed:", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  app.post("/api/score-comprehensive", requireAuth, async (req: AuthRequest, res) => {
    const budget = checkAiBudget(req.user!.id);
    if (!budget.allowed) {
      res.status(429).json({ error: budget.reason });
      return;
    }
    const parsed = scoreComprehensiveBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    try {
      const result = await aiService.scoreLead({
        companyName: parsed.data.companyName,
        dataScience: parsed.data.dataScience ?? 70,
        powerBI: parsed.data.powerBI ?? 70,
        cloud: parsed.data.cloud ?? 70,
        automation: parsed.data.automation ?? 70,
        buyingIntent: parsed.data.buyingIntent ?? 70,
      });
      recordAiUsage(req.user!.id, result.usage.totalTokens);
      res.json({
        success: true,
        score: result.data.score,
        recommendations: result.data.recommendations,
        provider:
          result.provider === "gemini"
            ? "Gemini AI Analytics"
            : "Local Score Expert Rules Engine",
      });
    } catch (err) {
      incrementErrors();
      console.error("[/api/score-comprehensive] failed:", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // Unmatched API routes return JSON 404 (never the SPA HTML) so the client
  // always receives a parseable error instead of an HTML document.
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  if (process.env.NODE_ENV !== "production") {
    console.log(
      "Setting up Express in development mode with active Vite middleware...",
    );
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log(
      "Setting up Express in production mode serving static built files in dist...",
    );
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global error-handling middleware (safety net for sync throws / next(err)
  // and middleware errors). Logs server-side, returns a safe JSON message.
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error("[unhandled-route-error]", err);
      incrementErrors();
      if (res.headersSent) return;
      res.status(500).json({ error: "Internal server error" });
    },
  );

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `TECHNETICS Backend Platform running on http://localhost:${PORT}`,
    );
  });
}

// Process-level guards so a stray rejection/exception never silently wedges
// the process in an undefined state.
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});

startServer().catch((err) => {
  console.error("[startup] Fatal error starting server:", err);
  process.exit(1);
});
