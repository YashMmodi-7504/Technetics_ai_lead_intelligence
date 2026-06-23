import { Router } from "express";
import { db } from "../db/index.js";
import {
  countries,
  companies,
  decisionMakers,
} from "../db/schema.js";
import { eq, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import {
  rowToCompany,
  rowToCountry,
  rowToDecisionMaker,
} from "../db/mappers.js";
import {
  sendError,
  isValidLeadStatus,
  parsePagination,
  type PaginatedResponse,
} from "./helpers.js";
import { aiService } from "../services/ai/index.js";
import {
  countryIntelligenceService,
  baselineFor,
} from "../services/countryIntelligence.js";
import { companyIntelligenceService } from "../services/companyIntelligence.js";
import type { DemandDimensions } from "../services/ai/schemas.js";
import type { Company } from "../types.js";

const router = Router();
router.use(requireAuth);

const statusUpdateSchema = z.object({
  status: z.string(),
  user: z.string().max(100).optional(),
});

const noteSchema = z.object({
  author: z.string().max(100).optional(),
  content: z.string().min(1).max(5000),
});

const scoresSchema = z.object({
  dataScienceScore: z.number().min(0).max(100).optional(),
  powerBIScore: z.number().min(0).max(100).optional(),
  cloudScore: z.number().min(0).max(100).optional(),
  automationScore: z.number().min(0).max(100).optional(),
  buyingIntentScore: z.number().min(0).max(100).optional(),
  leadScore: z.number().min(0).max(100).optional(),
});

const ingestSchema = z.object({
  linkedinUrl: z
    .string()
    .url()
    .max(500)
    .refine((v) => v.includes("linkedin.com/company/"), {
      message: "Must be a LinkedIn company URL",
    }),
});

const analyzeCountryBodySchema = z.object({
  name: z.string().min(1).max(100),
});

const analyzeCountrySlugBodySchema = z.object({
  isoCode: z.string().length(2).optional(),
});

/* ------------------------------------------------------------------ *
 * READ ENDPOINTS WITH PAGINATION                                      *
 * ------------------------------------------------------------------ */

router.get("/countries", async (req, res) => {
  try {
    const { limit, offset } = parsePagination(
      req.query as Record<string, unknown>,
    );
    const [rows, countResult] = await Promise.all([
      db.select().from(countries).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(countries),
    ]);
    const total = countResult[0]?.count ?? 0;
    const response: PaginatedResponse<ReturnType<typeof rowToCountry>> = {
      data: rows.map(rowToCountry),
      pagination: { limit, offset, total },
    };
    res.json(response);
  } catch (error) {
    sendError(res, error, "GET /crm/countries");
  }
});

router.get("/companies", async (req, res) => {
  try {
    const { limit, offset } = parsePagination(
      req.query as Record<string, unknown>,
    );
    const [rows, countResult] = await Promise.all([
      db.select().from(companies).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(companies),
    ]);
    const total = countResult[0]?.count ?? 0;
    const response: PaginatedResponse<ReturnType<typeof rowToCompany>> = {
      data: rows.map(rowToCompany),
      pagination: { limit, offset, total },
    };
    res.json(response);
  } catch (error) {
    sendError(res, error, "GET /crm/companies");
  }
});

router.get("/decision-makers", async (req, res) => {
  try {
    const { limit, offset } = parsePagination(
      req.query as Record<string, unknown>,
    );
    const [rows, countResult] = await Promise.all([
      db.select().from(decisionMakers).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(decisionMakers),
    ]);
    const total = countResult[0]?.count ?? 0;
    const response: PaginatedResponse<ReturnType<typeof rowToDecisionMaker>> =
      {
        data: rows.map(rowToDecisionMaker),
        pagination: { limit, offset, total },
      };
    res.json(response);
  } catch (error) {
    sendError(res, error, "GET /crm/decision-makers");
  }
});

/* ------------------------------------------------------------------ *
 * MUTATION ENDPOINTS                                                  *
 * ------------------------------------------------------------------ */

router.put("/companies/:slug/status", async (req, res) => {
  try {
    const { slug } = req.params;
    const parsed = statusUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const { status, user } = parsed.data;
    if (!isValidLeadStatus(status)) {
      res.status(400).json({ error: "Invalid or missing status" });
      return;
    }

    const existing = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, slug))
      .limit(1);
    if (!existing.length) {
      res.status(404).json({ error: "Company not found" });
      return;
    }

    const company = rowToCompany(existing[0]);
    const log = {
      id: `dyn-log-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      type:
        status === "Won"
          ? "proposal"
          : status === "Meeting Scheduled"
            ? "meeting"
            : "system",
      title: `Moved to ${status}`,
      description: "Status transition updated on pipeline board.",
      user: user || "System",
    } as Company["activityTimeline"][number];

    const updatedProfile: Company = {
      ...company,
      status: status as Company["status"],
      activityTimeline: [log, ...company.activityTimeline],
    };

    const updated = await db
      .update(companies)
      .set({ status, profile: updatedProfile, updatedAt: new Date() })
      .where(eq(companies.slug, slug))
      .returning();

    res.json(rowToCompany(updated[0]));
  } catch (error) {
    sendError(res, error, "PUT /crm/companies/:slug/status");
  }
});

router.post("/companies/:slug/notes", async (req, res) => {
  try {
    const { slug } = req.params;
    const parsed = noteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const { author, content } = parsed.data;

    const existing = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, slug))
      .limit(1);
    if (!existing.length) {
      res.status(404).json({ error: "Company not found" });
      return;
    }

    const company = rowToCompany(existing[0]);
    const note = {
      id: `note-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      author: author || "System",
      content,
    };
    const updatedProfile: Company = {
      ...company,
      notes: [note, ...company.notes],
    };

    const updated = await db
      .update(companies)
      .set({ profile: updatedProfile, updatedAt: new Date() })
      .where(eq(companies.slug, slug))
      .returning();

    res.json(rowToCompany(updated[0]));
  } catch (error) {
    sendError(res, error, "POST /crm/companies/:slug/notes");
  }
});

router.put("/companies/:slug/scores", async (req, res) => {
  try {
    const { slug } = req.params;
    const parsed = scoresSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const {
      dataScienceScore,
      powerBIScore,
      cloudScore,
      automationScore,
      buyingIntentScore,
      leadScore,
    } = parsed.data;

    const existing = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, slug))
      .limit(1);
    if (!existing.length) {
      res.status(404).json({ error: "Company not found" });
      return;
    }

    const company = rowToCompany(existing[0]);
    const updatedProfile: Company = {
      ...company,
      dataScienceScore: dataScienceScore ?? company.dataScienceScore,
      powerBIScore: powerBIScore ?? company.powerBIScore,
      cloudScore: cloudScore ?? company.cloudScore,
      automationScore: automationScore ?? company.automationScore,
      buyingIntentScore: buyingIntentScore ?? company.buyingIntentScore,
      leadScore: leadScore ?? company.leadScore,
    };

    const updated = await db
      .update(companies)
      .set({
        leadScore: updatedProfile.leadScore,
        profile: updatedProfile,
        updatedAt: new Date(),
      })
      .where(eq(companies.slug, slug))
      .returning();

    res.json(rowToCompany(updated[0]));
  } catch (error) {
    sendError(res, error, "PUT /crm/companies/:slug/scores");
  }
});

router.post("/companies/ingest", async (req, res) => {
  try {
    const parsed = ingestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const { linkedinUrl } = parsed.data;

    const handle =
      linkedinUrl
        .split("linkedin.com/company/")[1]
        ?.replace(/\/.*$/, "")
        .replace(/[^a-zA-Z0-9-]/g, "") || `company-${Date.now()}`;
    const slug = `comp-${handle}-${Date.now()}`;
    const displayName = handle
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const profile: Company = {
      id: slug,
      name: displayName,
      logo: "\uD83C\uDFE2",
      country: "Unknown",
      countryCode: "--",
      industry: "Pending Enrichment",
      employees: 0,
      website: "",
      linkedin: linkedinUrl,
      aiScore: 0,
      leadScore: 0,
      status: "New Leads",
      description:
        "Imported from LinkedIn. Enrichment pending (see Task #9).",
      techStack: [],
      services: [],
      locations: [],
      hiringActivity: "N/A",
      dataScienceScore: 0,
      powerBIScore: 0,
      cloudScore: 0,
      automationScore: 0,
      buyingIntentScore: 0,
      recommendedService: "Pending analysis",
      opportunityAnalysis: "Awaiting AI enrichment.",
      notes: [],
      activityTimeline: [
        {
          id: `a-${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          type: "system",
          title: "Company Imported",
          description: `Ingested from ${linkedinUrl}.`,
          user: "Ingestion Service",
        },
      ],
    };

    const inserted = await db
      .insert(companies)
      .values({
        slug,
        name: displayName,
        domain: "",
        industry: profile.industry,
        countrySlug: profile.countryCode,
        status: profile.status,
        leadScore: 0,
        aiScore: 0,
        profile,
      })
      .returning();

    res.status(201).json(rowToCompany(inserted[0]));
  } catch (error) {
    sendError(res, error, "POST /crm/companies/ingest");
  }
});

/* ------------------------------------------------------------------ *
 * AI-BACKED ENDPOINTS                                                 *
 * ------------------------------------------------------------------ */

router.post("/countries/analyze", async (req, res) => {
  try {
    const parsed = analyzeCountryBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const { name } = parsed.data;
    const result = await aiService.analyzeCountry(name);
    if (!result) {
      res.status(503).json({ error: "AI service unavailable" });
      return;
    }
    res.json({ name, analysis: result.data, provider: result.provider });
  } catch (error) {
    sendError(res, error, "POST /crm/countries/analyze");
  }
});

/* ------------------------------------------------------------------ *
 * COUNTRY INTELLIGENCE                                                *
 * ------------------------------------------------------------------ */

router.get("/countries/:slug/intelligence", async (req, res) => {
  try {
    const { slug } = req.params;
    const rows = await db
      .select()
      .from(countries)
      .where(eq(countries.slug, slug))
      .limit(1);
    if (!rows.length) {
      res.status(404).json({ error: "Country not found" });
      return;
    }
    const row = rows[0];
    if (!row.demandScores) {
      res.status(404).json({
        error: "No intelligence generated yet. POST .../analyze first.",
      });
      return;
    }
    res.json({
      slug: row.slug,
      name: row.name,
      isoCode: row.isoCode,
      demandScores: row.demandScores,
      skillRankings: row.skillRankings,
      recommendedServices: row.recommendedServices,
      demandOverall: row.demandOverall,
      source: row.intelligenceSource,
      generatedAt: row.intelligenceGeneratedAt,
    });
  } catch (error) {
    sendError(res, error, "GET /crm/countries/:slug/intelligence");
  }
});

router.post("/countries/:slug/analyze", async (req, res) => {
  try {
    const { slug } = req.params;
    const rows = await db
      .select()
      .from(countries)
      .where(eq(countries.slug, slug))
      .limit(1);
    if (!rows.length) {
      res.status(404).json({ error: "Country not found" });
      return;
    }
    const row = rows[0];
    const bodyParsed = analyzeCountrySlugBodySchema.safeParse(req.body);
    const isoCode = bodyParsed.success
      ? (bodyParsed.data.isoCode ?? row.isoCode)
      : row.isoCode;

    const intel = await countryIntelligenceService.generate(row.name, isoCode);

    const updated = await db
      .update(countries)
      .set({
        isoCode: isoCode ?? row.isoCode,
        demandScores: intel.demandScores,
        skillRankings: intel.skillRankings,
        recommendedServices: intel.recommendedServices,
        demandOverall: intel.demandOverall,
        intelligenceSource: intel.source,
        intelligenceGeneratedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(countries.slug, slug))
      .returning();

    const r = updated[0];
    res.json({
      slug: r.slug,
      name: r.name,
      isoCode: r.isoCode,
      demandScores: r.demandScores,
      skillRankings: r.skillRankings,
      recommendedServices: r.recommendedServices,
      demandOverall: r.demandOverall,
      topIndustries: intel.topIndustries,
      summary: intel.summary,
      source: r.intelligenceSource,
      generatedAt: r.intelligenceGeneratedAt,
    });
  } catch (error) {
    sendError(res, error, "POST /crm/countries/:slug/analyze");
  }
});

/* ------------------------------------------------------------------ *
 * COMPANY INTELLIGENCE / DISCOVERY                                    *
 * ------------------------------------------------------------------ */

async function resolveCountryDemand(
  countrySlug: string | null,
  isoCode: string | null,
): Promise<DemandDimensions> {
  if (countrySlug) {
    const rows = await db
      .select()
      .from(countries)
      .where(eq(countries.slug, countrySlug))
      .limit(1);
    const stored = rows[0]?.demandScores as DemandDimensions | undefined;
    if (stored) return stored;
    if (rows[0]?.isoCode) return baselineFor(rows[0].isoCode);
  }
  return baselineFor(isoCode);
}

router.post("/companies/:slug/score-intelligence", async (req, res) => {
  try {
    const { slug } = req.params;
    const rows = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, slug))
      .limit(1);
    if (!rows.length) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    const row = rows[0];
    const company = rowToCompany(row);

    const demand = await resolveCountryDemand(row.countrySlug, row.isoCode);
    const scores = await companyIntelligenceService.score(
      {
        name: company.name,
        domain: company.website,
        industry: company.industry,
        employeeCount: row.employeeCount ?? company.employees,
      },
      demand,
    );

    const updatedProfile: Company = {
      ...company,
      aiScore: scores.aiReadinessScore,
      dataScienceScore: scores.dataScienceScore,
      powerBIScore: scores.powerBiScore,
      cloudScore: scores.cloudScore,
      automationScore: scores.automationScore,
    };

    const updated = await db
      .update(companies)
      .set({
        aiReadinessScore: scores.aiReadinessScore,
        dataScienceScore: scores.dataScienceScore,
        dataEngineeringScore: scores.dataEngineeringScore,
        powerBiScore: scores.powerBiScore,
        cloudScore: scores.cloudScore,
        automationScore: scores.automationScore,
        opportunityScore: scores.opportunityScore,
        aiScore: scores.aiReadinessScore,
        intelligenceSource: scores.source,
        intelligenceGeneratedAt: new Date(),
        profile: updatedProfile,
        updatedAt: new Date(),
      })
      .where(eq(companies.slug, slug))
      .returning();

    const r = updated[0];
    res.json({
      slug: r.slug,
      name: r.name,
      aiReadinessScore: r.aiReadinessScore,
      dataScienceScore: r.dataScienceScore,
      dataEngineeringScore: r.dataEngineeringScore,
      powerBiScore: r.powerBiScore,
      cloudScore: r.cloudScore,
      automationScore: r.automationScore,
      opportunityScore: r.opportunityScore,
      techStack: scores.techStack,
      hiringNeeds: scores.hiringNeeds,
      source: r.intelligenceSource,
      generatedAt: r.intelligenceGeneratedAt,
    });
  } catch (error) {
    sendError(res, error, "POST /crm/companies/:slug/score-intelligence");
  }
});

router.get("/companies/:slug/intelligence", async (req, res) => {
  try {
    const { slug } = req.params;
    const rows = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, slug))
      .limit(1);
    if (!rows.length) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    const r = rows[0];
    if (r.opportunityScore == null) {
      res.status(404).json({
        error:
          "No intelligence generated yet. POST .../score-intelligence first.",
      });
      return;
    }
    res.json({
      slug: r.slug,
      name: r.name,
      aiReadinessScore: r.aiReadinessScore,
      dataScienceScore: r.dataScienceScore,
      dataEngineeringScore: r.dataEngineeringScore,
      powerBiScore: r.powerBiScore,
      cloudScore: r.cloudScore,
      automationScore: r.automationScore,
      opportunityScore: r.opportunityScore,
      source: r.intelligenceSource,
      generatedAt: r.intelligenceGeneratedAt,
    });
  } catch (error) {
    sendError(res, error, "GET /crm/companies/:slug/intelligence");
  }
});

router.get("/companies/discovery", async (req, res) => {
  try {
    const { limit, offset } = parsePagination(
      req.query as Record<string, unknown>,
    );
    const countrySlug =
      typeof req.query.country === "string" ? req.query.country : undefined;
    const minOpportunity = Number(req.query.minOpportunity) || 0;

    const baseQuery = db
      .select()
      .from(companies)
      .orderBy(desc(companies.opportunityScore));

    const rows = countrySlug
      ? await baseQuery
          .where(eq(companies.countrySlug, countrySlug))
          .limit(limit)
          .offset(offset)
      : await baseQuery.limit(limit).offset(offset);

    const result = rows
      .map((r) => ({
        slug: r.slug,
        name: r.name,
        country: r.countrySlug,
        industry: r.industry,
        employeeCount: r.employeeCount,
        opportunityScore: r.opportunityScore ?? 0,
        aiReadinessScore: r.aiReadinessScore ?? 0,
      }))
      .filter((c) => c.opportunityScore >= minOpportunity);

    res.json(result);
  } catch (error) {
    sendError(res, error, "GET /crm/companies/discovery");
  }
});

export default router;
