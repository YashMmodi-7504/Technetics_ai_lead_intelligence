// Import pipeline: deduplicate → insert companies → insert DMs → baseline score.
// Reuses existing companyIntelligence and countryIntelligence pure functions.
// No AI calls during import — scoring uses deterministic baseline values.

import { db } from "../db/index.js";
import { companies, decisionMakers, importBatches } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { baselineFor } from "./countryIntelligence.js";
import {
  sizeMultiplier,
  dimensionScore,
  aiReadiness,
} from "./companyIntelligence.js";
import type { Company, DecisionMaker } from "../types.js";
import type { ParsedLead, CsvProvider } from "./leadCsvParser.js";
import { normalizeTitle, priorityForSeniority } from "./titleNormalizer.js";

export interface ImportStats {
  batchSlug: string;
  provider: CsvProvider;
  totalRows: number;
  companiesCreated: number;
  companiesSkipped: number;
  decisionMakersCreated: number;
  decisionMakersSkipped: number;
  errorCount: number;
  errors: Array<{ row: number; message: string }>;
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function makeSlug(prefix: string, name: string): string {
  const safe = (name || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 28)
    .replace(/^-|-$/g, "");
  return `${prefix}-${safe}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

function normalizeDomain(url: string): string {
  if (!url) return "";
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .toLowerCase()
    .trim();
}

// ─── DB dedup helpers ──────────────────────────────────────────────────────────

// Load all existing company slugs, names, and domains in one query per batch.
async function loadExistingCompanies(): Promise<Map<string, string>> {
  const rows = await db
    .select({ slug: companies.slug, name: companies.name, domain: companies.domain })
    .from(companies);

  const map = new Map<string, string>(); // key → slug
  for (const r of rows) {
    if (r.name) map.set(r.name.toLowerCase().trim(), r.slug);
    const d = normalizeDomain(r.domain ?? "");
    if (d) map.set(`domain:${d}`, r.slug);
  }
  return map;
}

// Load all existing DM emails and LinkedIn URLs for dedup.
async function loadExistingDmKeys(): Promise<Set<string>> {
  const rows = await db
    .select({ profile: decisionMakers.profile })
    .from(decisionMakers);

  const keys = new Set<string>();
  for (const r of rows) {
    const p = r.profile as DecisionMaker;
    if (p.email) keys.add(`email:${p.email.toLowerCase().trim()}`);
    if (p.linkedin) keys.add(`li:${p.linkedin.trim()}`);
    // Fallback identity for contacts that lack both email and LinkedIn.
    if (p.name && p.companyId) keys.add(`name:${p.name.toLowerCase().trim()}@${p.companyId}`);
  }
  return keys;
}

// ─── Profile builders ──────────────────────────────────────────────────────────

function buildCompanyProfile(lead: ParsedLead, slug: string, batchSlug: string): Company {
  const demand = baselineFor(lead.companyCountryCode || null);
  const size = sizeMultiplier(lead.companyEmployees || null);

  const dataScienceScore = dimensionScore(demand.dataScience, 0.7, size);
  const powerBIScore     = dimensionScore(demand.powerBI, 0.75, size);
  const cloudScore       = dimensionScore(demand.cloud, 0.75, size);
  const automationScore  = dimensionScore(demand.automation, 0.75, size);
  const aiScore          = aiReadiness(demand, size, []);
  const leadScore        = Math.round(
    dataScienceScore * 0.2 + powerBIScore * 0.2 + cloudScore * 0.2 +
    automationScore * 0.2 + aiScore * 0.2,
  );

  return {
    id: slug,
    name: lead.companyName,
    logo: "🏢",
    country: lead.companyCountry || "Unknown",
    countryCode: lead.companyCountryCode || "--",
    industry: lead.companyIndustry || "Technology",
    employees: lead.companyEmployees || 0,
    website: lead.companyWebsite || "",
    linkedin: lead.companyLinkedin || "",
    aiScore,
    leadScore,
    status: "New Leads",
    description: lead.companyDescription || `Imported via CSV (batch ${batchSlug}).`,
    city: lead.companyCity || undefined,
    generalEmail: lead.companyGeneralEmail || undefined,
    generalPhone: lead.companyPhone || undefined,
    techStack: [],
    services: [],
    locations: [lead.companyCity, lead.companyCountry].filter(Boolean) as string[],
    hiringActivity: "N/A",
    dataScienceScore,
    powerBIScore,
    cloudScore,
    automationScore,
    buyingIntentScore: 50,
    recommendedService: "Pending AI Analysis",
    opportunityAnalysis: "Imported lead — run AI scoring for full opportunity analysis.",
    notes: [],
    activityTimeline: [
      {
        id: `import-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        type: "system",
        title: "Lead Imported",
        description: `Record created via CSV import batch ${batchSlug}.`,
        user: "Import System",
      },
    ],
  };
}

function buildDmProfile(
  lead: ParsedLead,
  companySlug: string,
  companyName: string,
): DecisionMaker {
  const slug = makeSlug("dm", lead.fullName || lead.email || "contact");

  // Normalize the raw job title → canonical role + seniority tier. Prefer the
  // provider-supplied seniority when present, else derive from the title.
  const norm = normalizeTitle(lead.role);
  const providerSeniority = lead.seniority.toLowerCase();
  let priorityScore = priorityForSeniority(norm.seniority);
  if (providerSeniority.includes("c-suite") || providerSeniority.includes("founder")) priorityScore = 95;
  else if (providerSeniority.includes("vp")) priorityScore = 88;
  else if (providerSeniority.includes("director") || providerSeniority.includes("head")) priorityScore = 85;

  const rawTitle = lead.role.trim();
  return {
    id: slug,
    name: lead.fullName || `${lead.firstName} ${lead.lastName}`.trim() || "Unknown Contact",
    // Display the real title; fall back to the normalized canonical role.
    role: ((rawTitle || norm.canonical) as DecisionMaker["role"]) || "Contact",
    companyId: companySlug,
    companyName,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.fullName || "?")}&background=0EA5E9&color=fff&size=128`,
    linkedin: lead.linkedin || "",
    priorityScore,
    contactStatus: "New",
    email: lead.email || "",
    title: rawTitle || norm.canonical,
    decisionMakerType: lead.decisionMakerType || norm.canonical,
  };
}

// ─── Main pipeline ─────────────────────────────────────────────────────────────

export async function runImportPipeline(
  leads: ParsedLead[],
  provider: CsvProvider,
  filename: string,
  userId: number,
): Promise<ImportStats> {
  const batchSlug = makeSlug("batch", provider);
  const errors: Array<{ row: number; message: string }> = [];

  let companiesCreated = 0;
  let companiesSkipped = 0;
  let decisionMakersCreated = 0;
  let decisionMakersSkipped = 0;

  // Pre-load existing records for efficient dedup
  const existingCompanies = await loadExistingCompanies();
  const existingDmKeys    = await loadExistingDmKeys();

  // Insert the batch record (status: processing)
  await db.insert(importBatches).values({
    slug: batchSlug,
    filename,
    provider,
    uploadedBy: userId,
    rowCount: leads.length,
    status: "processing",
  });

  // Within-batch company map: companyName.lower → slug
  const batchCompanyMap = new Map<string, string>();

  for (const lead of leads) {
    try {
      // ── Company dedup ──────────────────────────────────────────────────────
      const nameKey   = lead.companyName.toLowerCase().trim();
      const domainKey = `domain:${normalizeDomain(lead.companyWebsite)}`;

      let companySlug =
        batchCompanyMap.get(nameKey) ??
        existingCompanies.get(nameKey) ??
        (lead.companyWebsite ? existingCompanies.get(domainKey) : undefined) ??
        null;

      if (!companySlug && lead.companyName) {
        companySlug = makeSlug("comp", lead.companyName);
        const profile = buildCompanyProfile(lead, companySlug, batchSlug);

        await db.insert(companies).values({
          slug: companySlug,
          name: lead.companyName,
          domain: lead.companyWebsite || "",
          industry: lead.companyIndustry || "Technology",
          countrySlug: lead.companyCountryCode || "--",
          isoCode: lead.companyCountryCode || null,
          employeeCount: lead.companyEmployees || null,
          status: "New Leads",
          leadScore: profile.leadScore,
          aiScore: profile.aiScore,
          dataScienceScore: profile.dataScienceScore,
          powerBiScore: profile.powerBIScore,
          cloudScore: profile.cloudScore,
          automationScore: profile.automationScore,
          importSource: provider,
          importBatchId: batchSlug,
          profile,
        });

        // Update dedup maps so within-batch duplicates are caught
        batchCompanyMap.set(nameKey, companySlug);
        existingCompanies.set(nameKey, companySlug);
        if (lead.companyWebsite) existingCompanies.set(domainKey, companySlug);
        companiesCreated++;
      } else if (companySlug) {
        batchCompanyMap.set(nameKey, companySlug);
        companiesSkipped++;
      } else {
        // No company name — skip this lead entirely
        errors.push({ row: lead.rowIndex, message: "No company name — row skipped" });
        continue;
      }

      // ── Decision Maker dedup ───────────────────────────────────────────────
      if (lead.fullName || lead.email) {
        const dmName = (lead.fullName || `${lead.firstName} ${lead.lastName}`.trim()).toLowerCase().trim();
        const emailKey = lead.email ? `email:${lead.email.toLowerCase().trim()}` : "";
        const liKey    = lead.linkedin ? `li:${lead.linkedin.trim()}` : "";
        const nameKey  = dmName ? `name:${dmName}@${companySlug}` : "";

        // Dedup by email/LinkedIn when available; otherwise fall back to
        // name@company so contacts without contact details still de-duplicate.
        const dmExists =
          (emailKey && existingDmKeys.has(emailKey)) ||
          (liKey && existingDmKeys.has(liKey)) ||
          (!emailKey && !liKey && nameKey && existingDmKeys.has(nameKey));

        if (!dmExists) {
          const dm = buildDmProfile(lead, companySlug, lead.companyName);
          await db.insert(decisionMakers).values({
            slug: dm.id,
            companySlug,
            name: dm.name,
            role: dm.role || null,
            email: dm.email || null,
            priorityScore: dm.priorityScore,
            importSource: provider,
            importBatchId: batchSlug,
            profile: dm,
          });

          if (emailKey) existingDmKeys.add(emailKey);
          if (liKey)    existingDmKeys.add(liKey);
          if (nameKey)  existingDmKeys.add(nameKey);
          decisionMakersCreated++;
        } else {
          decisionMakersSkipped++;
        }
      }
    } catch (err: unknown) {
      errors.push({
        row: lead.rowIndex,
        message: (err as Error)?.message ?? "Unexpected error",
      });
    }
  }

  // Finalize batch record
  await db
    .update(importBatches)
    .set({
      companiesCreated,
      companiesSkipped,
      decisionMakersCreated,
      decisionMakersSkipped,
      errorCount: errors.length,
      errorLog: errors,
      status: "complete",
      completedAt: new Date(),
    })
    .where(eq(importBatches.slug, batchSlug));

  return {
    batchSlug,
    provider,
    totalRows: leads.length,
    companiesCreated,
    companiesSkipped,
    decisionMakersCreated,
    decisionMakersSkipped,
    errorCount: errors.length,
    errors,
  };
}
