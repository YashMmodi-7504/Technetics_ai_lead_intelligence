// Import quality report (Phase 8A). Analyzes parsed leads BEFORE commit so the
// user can judge data completeness, in-file duplication, title-normalization
// coverage, and source-detection confidence.

import type { ParsedLead, CsvProvider } from "./leadCsvParser.js";
import { normalizeTitle, type SeniorityTier } from "./titleNormalizer.js";

export interface QualityReport {
  score: number; // 0-100 overall data quality
  grade: "A" | "B" | "C" | "D";
  totalRows: number;
  validRows: number;
  skippedRows: number;
  parseErrorCount: number;
  completeness: {
    company: number;
    title: number;
    email: number;
    linkedin: number;
    country: number;
    employees: number;
  };
  duplicatesInFile: { companies: number; decisionMakers: number };
  titleNormalization: { coverage: number; normalized: number; unmatched: number };
  sourceDetection: { provider: CsvProvider; confidence: number; matchedSignals: string[] };
  seniorityDistribution: Record<string, number>;
  topRoles: Array<{ role: string; count: number }>;
  warnings: string[];
}

const SIGNAL_HEADERS: Record<Exclude<CsvProvider, "generic">, string[]> = {
  apollo: ["email status", "seniority", "company name for emails"],
  linkedin: ["connected on", "email address"],
  salesnavigator: ["linkedin profile url", "account name", "company domain"],
};

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function detectionConfidence(
  provider: CsvProvider,
  headers: string[],
): { confidence: number; matchedSignals: string[] } {
  if (provider === "generic") return { confidence: 50, matchedSignals: [] };
  const hset = new Set(headers.map((h) => h.toLowerCase().trim()));
  const signals = SIGNAL_HEADERS[provider].filter((s) => hset.has(s));
  // Base 70% for any signal match, +10 per additional signal, capped at 99.
  const confidence = signals.length === 0 ? 60 : Math.min(99, 70 + (signals.length - 1) * 12);
  return { confidence, matchedSignals: signals };
}

export function buildQualityReport(
  leads: ParsedLead[],
  provider: CsvProvider,
  headers: string[],
  parseErrorCount: number,
  skippedRows: number,
): QualityReport {
  const total = leads.length;

  const has = (fn: (l: ParsedLead) => boolean) => leads.filter(fn).length;
  const completeness = {
    company: pct(has((l) => !!l.companyName), total),
    title: pct(has((l) => !!l.role), total),
    email: pct(has((l) => !!l.email), total),
    linkedin: pct(has((l) => !!l.linkedin || !!l.companyLinkedin), total),
    country: pct(has((l) => !!l.companyCountry), total),
    employees: pct(has((l) => l.companyEmployees > 0), total),
  };

  // In-file duplicate detection (mirrors pipeline dedup keys).
  const companyKeys = new Set<string>();
  let dupCompanies = 0;
  const dmKeys = new Set<string>();
  let dupDms = 0;

  const seniorityDistribution: Record<string, number> = {};
  const roleCounts = new Map<string, number>();
  let normalized = 0;
  let unmatched = 0;

  for (const l of leads) {
    const cKey = (l.companyName || "").toLowerCase().trim();
    if (cKey) {
      if (companyKeys.has(cKey)) dupCompanies++;
      else companyKeys.add(cKey);
    }

    if (l.fullName || l.email) {
      const dKey = (l.email || l.linkedin || l.fullName).toLowerCase().trim();
      if (dKey) {
        if (dmKeys.has(dKey)) dupDms++;
        else dmKeys.add(dKey);
      }

      if (l.role) {
        const norm = normalizeTitle(l.role);
        norm.matched ? normalized++ : unmatched++;
        const tier: SeniorityTier = norm.seniority;
        seniorityDistribution[tier] = (seniorityDistribution[tier] ?? 0) + 1;
        roleCounts.set(norm.canonical, (roleCounts.get(norm.canonical) ?? 0) + 1);
      }
    }
  }

  const titledLeads = normalized + unmatched;
  const titleNormalization = {
    coverage: pct(normalized, titledLeads),
    normalized,
    unmatched,
  };

  const topRoles = [...roleCounts.entries()]
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const source = detectionConfidence(provider, headers);

  // Overall score: weighted blend of completeness + normalization + detection.
  const completenessAvg =
    (completeness.company * 0.3 +
      completeness.title * 0.2 +
      completeness.email * 0.2 +
      completeness.linkedin * 0.1 +
      completeness.country * 0.1 +
      completeness.employees * 0.1);
  const score = Math.round(
    completenessAvg * 0.6 + titleNormalization.coverage * 0.2 + source.confidence * 0.2,
  );
  const grade: QualityReport["grade"] = score >= 85 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : "D";

  const warnings: string[] = [];
  if (completeness.email < 60) warnings.push(`Only ${completeness.email}% of contacts have an email address.`);
  if (completeness.country < 50) warnings.push(`Only ${completeness.country}% of rows include a country — opportunity scoring uses a global baseline for the rest.`);
  if (dupCompanies > 0) warnings.push(`${dupCompanies} duplicate company rows detected in-file (will be merged).`);
  if (dupDms > 0) warnings.push(`${dupDms} duplicate contact rows detected in-file (will be skipped).`);
  if (titleNormalization.unmatched > 0) warnings.push(`${titleNormalization.unmatched} job titles couldn't be matched to a canonical role (kept as-is).`);
  if (provider === "generic") warnings.push("Source could not be auto-detected with high confidence — using generic column mapping.");

  return {
    score,
    grade,
    totalRows: total + skippedRows,
    validRows: total,
    skippedRows,
    parseErrorCount,
    completeness,
    duplicatesInFile: { companies: dupCompanies, decisionMakers: dupDms },
    titleNormalization,
    sourceDetection: { provider, confidence: source.confidence, matchedSignals: source.matchedSignals },
    seniorityDistribution,
    topRoles,
    warnings,
  };
}
