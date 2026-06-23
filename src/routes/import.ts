import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { csvUpload } from "../middleware/upload.js";
import { parseCsv } from "../services/leadCsvParser.js";
import { runImportPipeline } from "../services/importPipeline.js";
import { buildQualityReport } from "../services/importQuality.js";
import { normalizeTitle } from "../services/titleNormalizer.js";
import { db } from "../db/index.js";
import { importBatches } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { sendError } from "./helpers.js";
import type { AuthRequest } from "../middleware/auth.js";
import type { Response } from "express";

const router = Router();
router.use(requireAuth as any);

// ── POST /api/import/preview ───────────────────────────────────────────────────
// Parse only — no DB writes. Returns a preview of what will be imported.
router.post("/preview", csvUpload, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const text = file.buffer.toString("utf-8");
    const result = parseCsv(text);

    // Aggregate companies from leads
    const companyMap = new Map<string, { name: string; industry: string; country: string; dmCount: number }>();
    for (const lead of result.leads) {
      if (!lead.companyName) continue;
      const key = lead.companyName.toLowerCase();
      const existing = companyMap.get(key);
      if (existing) {
        existing.dmCount++;
      } else {
        companyMap.set(key, {
          name: lead.companyName,
          industry: lead.companyIndustry,
          country: lead.companyCountry,
          dmCount: 1,
        });
      }
    }

    const dmLeads = result.leads.filter((l) => l.fullName || l.email);

    const quality = buildQualityReport(
      result.leads,
      result.provider,
      result.headers,
      result.parseErrors.length,
      result.skippedRows,
    );

    res.json({
      provider: result.provider,
      filename: file.originalname,
      totalRows: result.leads.length + result.skippedRows,
      validRows: result.leads.length,
      skippedRows: result.skippedRows,
      companiesDetected: companyMap.size,
      decisionMakersDetected: dmLeads.length,
      parseErrors: result.parseErrors,
      quality,
      companyPreview: Array.from(companyMap.values()).slice(0, 20),
      leadPreview: result.leads.slice(0, 20).map((l) => ({
        name: l.fullName,
        role: l.role,
        normalizedRole: l.role ? normalizeTitle(l.role).canonical : "",
        email: l.email,
        company: l.companyName,
        linkedin: l.linkedin,
      })),
    });
  } catch (error) {
    sendError(res, error, "POST /import/preview");
  }
});

// ── POST /api/import/confirm ───────────────────────────────────────────────────
// Re-parse the file and commit to the database.
router.post("/confirm", csvUpload, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const text = file.buffer.toString("utf-8");
    const result = parseCsv(text);

    if (result.leads.length === 0) {
      res.status(400).json({ error: "No valid leads found in the uploaded CSV" });
      return;
    }

    const userId = req.user?.id ?? 0;
    const stats = await runImportPipeline(
      result.leads,
      result.provider,
      file.originalname,
      userId,
    );

    res.status(201).json(stats);
  } catch (error) {
    sendError(res, error, "POST /import/confirm");
  }
});

// ── GET /api/import/batches ────────────────────────────────────────────────────
// Return the 50 most recent import batches.
router.get("/batches", async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rows = await db
      .select()
      .from(importBatches)
      .orderBy(desc(importBatches.createdAt))
      .limit(50);
    res.json(rows);
  } catch (error) {
    sendError(res, error, "GET /import/batches");
  }
});

// ── DELETE /api/import/batches/:slug ──────────────────────────────────────────
// Remove a batch record. Companies/DMs are NOT cascaded — they remain as real records.
router.delete("/batches/:slug", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    if (!slug || !slug.trim()) {
      res.status(400).json({ error: "Missing batch slug" });
      return;
    }
    await db.delete(importBatches).where(eq(importBatches.slug, slug));
    res.status(204).send();
  } catch (error) {
    sendError(res, error, "DELETE /import/batches/:slug");
  }
});

export default router;
