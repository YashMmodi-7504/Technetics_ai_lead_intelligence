// Deterministic scoring + opportunity value, computed entirely from imported
// company records (V2 — no decision-maker dependency).
import type { Company } from "../types";

// Guard against legacy range-concatenation parse artifacts (e.g. the string
// "1000-5000" parsed to 10005000). No real company here exceeds ~10k staff, so
// any value above 100k is treated as a 1,000+ enterprise lower bound.
export function normalizedEmployees(company: Company): number {
  const e = company.employees || 0;
  return e > 100_000 ? 1000 : e;
}

/** Human-readable employee size, marking capped/legacy values as "1,000+". */
export function employeesLabel(company: Company): string {
  const e = company.employees || 0;
  if (e > 100_000) return "1,000+";
  if (e <= 0) return "—";
  return e.toLocaleString();
}

export interface ScoreFactor {
  label: string;
  points: number;
  hit: boolean;
}

// The platform's target geography (the 10 imported markets). Business config,
// not mock data — used as the "Country" scoring input.
const TARGET_MARKETS = new Set([
  "uae", "united arab emirates", "saudi arabia", "singapore", "switzerland", "norway",
  "qatar", "kuwait", "oman", "bahrain", "luxembourg",
]);

const TECH_KEYWORDS = /\b(ai|a\.i\.|artificial intelligence|machine learning|data|analytics|cloud|cyber|cybersecurity|digital|software|saas|automation|devops|ict|fintech|engineering)\b/;

export function isTargetMarket(company: Company): boolean {
  return TARGET_MARKETS.has((company.country || "").trim().toLowerCase());
}
export function hasTechKeywords(company: Company): boolean {
  return TECH_KEYWORDS.test(`${company.industry || ""} ${company.description || ""}`.toLowerCase());
}

// Internal record completeness (kept here to avoid a circular import with
// dataQuality.ts). Counts the 9 optional fields beyond the always-present name.
function recordCompletenessPct(c: Company): number {
  const fields = [
    !!c.website?.trim(), !!c.linkedin?.trim(), !!c.country?.trim(), !!c.city?.trim(),
    !!c.industry?.trim(), (c.employees || 0) > 0, !!c.description?.trim(),
    !!c.generalEmail?.trim(), !!c.generalPhone?.trim(),
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

/**
 * Lead score — computed purely from imported company fields (V4 factors).
 *   Base 35
 *   +18 enterprise size (>500 employees)   [Employee Size]
 *   +12 AI / Data / Analytics industry     [Industry]
 *   +10 business / technology keywords     [Business Keywords]
 *   +10 located in a target market         [Country]
 *   +15 well-completed record (≥70%)       [Data Completeness]
 *   capped at 100
 */
export function scoreFactors(company: Company): ScoreFactor[] {
  const industry = (company.industry || "").toLowerCase();
  return [
    { label: "Enterprise size (>500 employees)", points: 18, hit: normalizedEmployees(company) > 500 },
    { label: "AI / Data / Analytics industry", points: 12, hit: /\b(ai|a\.i\.|data|analytics|machine learning)\b/.test(industry) },
    { label: "Business / technology keywords", points: 10, hit: hasTechKeywords(company) },
    { label: "Target market", points: 10, hit: isTargetMarket(company) },
    { label: "Complete record (≥70% fields)", points: 15, hit: recordCompletenessPct(company) >= 70 },
  ];
}

export function computeLeadScore(company: Company): number {
  const base = 35;
  const earned = scoreFactors(company)
    .filter((f) => f.hit)
    .reduce((s, f) => s + f.points, 0);
  return Math.min(100, base + earned);
}

export type LeadBand = "Hot" | "Warm" | "Medium" | "Cold";
export function leadBand(score: number): LeadBand {
  if (score >= 80) return "Hot";
  if (score >= 65) return "Warm";
  if (score >= 50) return "Medium";
  return "Cold";
}

/**
 * Step 7 opportunity value by employee size:
 *   Small  (<200)        = $10,000
 *   Medium (200–1000)    = $25,000
 *   Large  (>1000)       = $50,000
 */
export function estimateOpportunityValue(company: Company): number {
  const e = normalizedEmployees(company);
  if (e > 1000) return 50_000;
  if (e >= 200) return 25_000;
  return 10_000;
}

export function opportunityTier(company: Company): "Small" | "Medium" | "Large" {
  const e = normalizedEmployees(company);
  if (e > 1000) return "Large";
  if (e >= 200) return "Medium";
  return "Small";
}

/** 0-100 opportunity score blending lead score (60%) with deal-size tier (40%). */
export function computeOpportunityScore(company: Company): number {
  const tier = opportunityTier(company);
  const tierScore = tier === "Large" ? 100 : tier === "Medium" ? 70 : 40;
  return Math.min(100, Math.round(company.leadScore * 0.6 + tierScore * 0.4));
}
