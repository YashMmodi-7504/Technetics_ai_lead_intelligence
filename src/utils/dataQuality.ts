// Data-quality + opportunity helpers — everything derived from imported company
// records (V4). No monetary/revenue assumptions: opportunity is expressed as a
// 0-100 potential score blended from real signals.
import type { Company } from "../types";
import { computeLeadScore, normalizedEmployees } from "./leadScoring";

// The 10 source fields a complete record should carry.
export const RECORD_FIELDS: Array<{ key: string; has: (c: Company) => boolean }> = [
  { key: "name", has: (c) => !!c.name?.trim() },
  { key: "website", has: (c) => !!c.website?.trim() },
  { key: "linkedin", has: (c) => !!c.linkedin?.trim() },
  { key: "country", has: (c) => !!c.country?.trim() },
  { key: "city", has: (c) => !!c.city?.trim() },
  { key: "industry", has: (c) => !!c.industry?.trim() },
  { key: "employees", has: (c) => (c.employees || 0) > 0 },
  { key: "description", has: (c) => !!c.description?.trim() },
  { key: "email", has: (c) => !!c.generalEmail?.trim() },
  { key: "phone", has: (c) => !!c.generalPhone?.trim() },
];

/** Percentage (0-100) of the 10 source fields present on a record. */
export function dataCompleteness(company: Company): number {
  const present = RECORD_FIELDS.filter((f) => f.has(company)).length;
  return Math.round((present / RECORD_FIELDS.length) * 100);
}

export const hasWebsite = (c: Company) => !!c.website?.trim();
export const hasLinkedin = (c: Company) => !!c.linkedin?.trim();
export const hasEmail = (c: Company) => !!c.generalEmail?.trim();
export const hasPhone = (c: Company) => !!c.generalPhone?.trim();

/** Coverage % across a set for a predicate. */
export function coverage(companies: Company[], pred: (c: Company) => boolean): number {
  if (companies.length === 0) return 0;
  return Math.round((companies.filter(pred).length / companies.length) * 100);
}

/** A record missing any of the 10 fields is "incomplete". */
export function isIncomplete(company: Company): boolean {
  return dataCompleteness(company) < 100;
}

/**
 * Opportunity potential (0-100) — a non-monetary blend of lead quality (size,
 * industry, country, keywords) and data completeness (how actionable the record is).
 */
export function opportunityPotential(company: Company): number {
  return Math.round(computeLeadScore(company) * 0.7 + dataCompleteness(company) * 0.3);
}

/**
 * Market attractiveness (0-100) for a set of companies in a market: blends
 * average opportunity potential, data completeness, and relative density.
 */
export function marketAttractiveness(companies: Company[], maxCount: number): number {
  if (companies.length === 0) return 0;
  const avgPotential = companies.reduce((s, c) => s + opportunityPotential(c), 0) / companies.length;
  const avgComplete = companies.reduce((s, c) => s + dataCompleteness(c), 0) / companies.length;
  const density = maxCount > 0 ? (companies.length / maxCount) * 100 : 0;
  return Math.round(avgPotential * 0.5 + avgComplete * 0.2 + density * 0.3);
}

/** Average normalized employee size across a set. */
export function avgEmployees(companies: Company[]): number {
  if (companies.length === 0) return 0;
  return Math.round(companies.reduce((s, c) => s + normalizedEmployees(c), 0) / companies.length);
}

// ── Country normalization ──────────────────────────────────────────────────
// Collapse aliases to ONE canonical value so a market is never split
// (e.g. "United Arab Emirates" and "UAE" → "UAE"). Canonical names match the
// imported market set.
const COUNTRY_ALIASES: Record<string, string> = {
  "united arab emirates": "UAE", "u.a.e": "UAE", "u.a.e.": "UAE", uae: "UAE", "the uae": "UAE", emirates: "UAE",
  ksa: "Saudi Arabia", "kingdom of saudi arabia": "Saudi Arabia", "saudi arabia": "Saudi Arabia", saudi: "Saudi Arabia",
  singapore: "Singapore", switzerland: "Switzerland", norway: "Norway", qatar: "Qatar",
  kuwait: "Kuwait", oman: "Oman", bahrain: "Bahrain", luxembourg: "Luxembourg",
};
export function normalizeCountry(raw?: string | null): string {
  const s = (raw || "").trim();
  if (!s) return s;
  return COUNTRY_ALIASES[s.toLowerCase()] ?? s;
}

// ── Country flags (emoji) for the target markets ──────────────────────────────
const FLAGS: Record<string, string> = {
  uae: "🇦🇪", "united arab emirates": "🇦🇪", "saudi arabia": "🇸🇦", singapore: "🇸🇬",
  switzerland: "🇨🇭", norway: "🇳🇴", qatar: "🇶🇦", kuwait: "🇰🇼",
  oman: "🇴🇲", bahrain: "🇧🇭", luxembourg: "🇱🇺",
};
export function countryFlag(country?: string): string {
  return FLAGS[(country || "").trim().toLowerCase()] ?? "🏳️";
}
