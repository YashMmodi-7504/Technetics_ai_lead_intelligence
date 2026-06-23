// ─────────────────────────────────────────────────────────────────────────────
// CENTRALIZED ANALYTICS SERVICE — the single source of truth for every dashboard
// widget. Given the raw imported company records, it derives ALL aggregations:
// dynamic country/industry lists, rankings, lead-band distribution, opportunity
// scores, and data-health coverage.
//
// 100% data-driven: nothing is hardcoded. New countries, industries, and
// companies flow through automatically with zero code changes — call this again
// after any import and every number recomputes.
// ─────────────────────────────────────────────────────────────────────────────
import type { Company } from "../types";
import { computeLeadScore, leadBand, normalizedEmployees, type LeadBand } from "./leadScoring";
import {
  normalizeCountry,
  coverage,
  hasWebsite,
  hasLinkedin,
  hasEmail,
  hasPhone,
  dataCompleteness,
  opportunityPotential,
  marketAttractiveness,
} from "./dataQuality";

export interface MarketStat {
  country: string;
  count: number;
  share: number; // % of all companies
  avgLeadScore: number;
  avgCompleteness: number;
  attractiveness: number; // 0-100 market attractiveness
  topIndustry: string;
}

export interface IndustryStat {
  industry: string;
  count: number;
  share: number;
  avgLeadScore: number;
  avgPotential: number;
  countries: number; // distinct countries the sector spans
}

export interface CoverageStat {
  website: number;
  linkedin: number;
  email: number;
  phone: number;
  overall: number; // avg record completeness
}

export interface CoverageCounts {
  website: number;
  linkedin: number;
  email: number;
  phone: number;
}

export interface Analytics {
  total: number;
  /** Distinct markets, generated dynamically from the data. */
  countries: string[];
  /** Distinct industries, generated dynamically from the data. */
  industries: string[];
  cities: string[];
  countByCountry: Record<string, number>;
  countByIndustry: Record<string, number>;
  marketRanking: MarketStat[]; // sorted by attractiveness desc
  industryRanking: IndustryStat[]; // sorted by potential then count desc
  bandCounts: Record<LeadBand, number>;
  coverage: CoverageStat;
  coverageCounts: CoverageCounts;
  avgLeadScore: number;
  avgOpportunity: number;
  avgEmployees: number;
  dataHealth: number;
  hotLeads: number;
  topMarket?: MarketStat;
  topIndustry?: IndustryStat;
}

function mostCommon(items: string[]): string {
  const m: Record<string, number> = {};
  items.forEach((i) => { const k = i || "Unknown"; m[k] = (m[k] || 0) + 1; });
  return Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
}

const round = (n: number) => Math.round(n);
const avg = (arr: number[]) => (arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0);

/**
 * Derive every dashboard metric from the imported records. Pure and
 * deterministic — same input always yields the same analytics.
 */
export function computeAnalytics(rawCompanies: Company[]): Analytics {
  // Normalize country aliases once (so a market is never split) and guarantee a
  // computed lead score for every record, even freshly imported ones.
  const companies = rawCompanies.map((c) => {
    const country = normalizeCountry(c.country);
    const withCountry = { ...c, country };
    return { ...withCountry, leadScore: c.leadScore || computeLeadScore(withCountry) };
  });

  const total = companies.length;

  const countByCountry: Record<string, number> = {};
  const countByIndustry: Record<string, number> = {};
  const byCountry: Record<string, Company[]> = {};
  const byIndustry: Record<string, Company[]> = {};
  const citySet = new Set<string>();

  companies.forEach((c) => {
    const country = c.country || "Unknown";
    const industry = c.industry || "Unknown";
    countByCountry[country] = (countByCountry[country] || 0) + 1;
    countByIndustry[industry] = (countByIndustry[industry] || 0) + 1;
    (byCountry[country] ||= []).push(c);
    (byIndustry[industry] ||= []).push(c);
    if (c.city?.trim()) citySet.add(c.city.trim());
  });

  const maxCountryCount = Math.max(1, ...Object.values(byCountry).map((a) => a.length), 0);

  const marketRanking: MarketStat[] = Object.entries(byCountry)
    .map(([country, cs]) => ({
      country,
      count: cs.length,
      share: total ? round((cs.length / total) * 100) : 0,
      avgLeadScore: round(avg(cs.map((c) => c.leadScore))),
      avgCompleteness: round(avg(cs.map((c) => dataCompleteness(c)))),
      attractiveness: marketAttractiveness(cs, maxCountryCount),
      topIndustry: mostCommon(cs.map((c) => c.industry || "Unknown")),
    }))
    .sort((a, b) => b.attractiveness - a.attractiveness || b.count - a.count);

  const industryRanking: IndustryStat[] = Object.entries(byIndustry)
    .map(([industry, cs]) => ({
      industry,
      count: cs.length,
      share: total ? round((cs.length / total) * 100) : 0,
      avgLeadScore: round(avg(cs.map((c) => c.leadScore))),
      avgPotential: round(avg(cs.map((c) => opportunityPotential(c)))),
      countries: new Set(cs.map((c) => c.country || "Unknown")).size,
    }))
    .sort((a, b) => b.avgPotential - a.avgPotential || b.count - a.count);

  const bandCounts: Record<LeadBand, number> = { Hot: 0, Warm: 0, Medium: 0, Cold: 0 };
  companies.forEach((c) => { bandCounts[leadBand(c.leadScore)] += 1; });

  const cov: CoverageStat = {
    website: coverage(companies, hasWebsite),
    linkedin: coverage(companies, hasLinkedin),
    email: coverage(companies, hasEmail),
    phone: coverage(companies, hasPhone),
    overall: round(avg(companies.map((c) => dataCompleteness(c)))),
  };

  // Distinct, dynamically generated lists sorted by frequency.
  const countries = Object.entries(countByCountry).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const industries = Object.entries(countByIndustry).sort((a, b) => b[1] - a[1]).map(([k]) => k);

  return {
    total,
    countries,
    industries,
    cities: Array.from(citySet).sort(),
    countByCountry,
    countByIndustry,
    marketRanking,
    industryRanking,
    bandCounts,
    coverage: cov,
    coverageCounts: {
      website: companies.filter(hasWebsite).length,
      linkedin: companies.filter(hasLinkedin).length,
      email: companies.filter(hasEmail).length,
      phone: companies.filter(hasPhone).length,
    },
    avgLeadScore: round(avg(companies.map((c) => c.leadScore))),
    avgOpportunity: round(avg(companies.map((c) => opportunityPotential(c)))),
    avgEmployees: total ? round(avg(companies.map((c) => normalizedEmployees(c)))) : 0,
    dataHealth: cov.overall,
    hotLeads: companies.filter((c) => c.leadScore >= 80).length,
    topMarket: marketRanking[0],
    topIndustry: industryRanking[0],
  };
}

/** Average normalized employee size — exposed for callers that need it. */
export function avgCompanySize(companies: Company[]): number {
  return companies.length
    ? round(avg(companies.map((c) => normalizedEmployees(c))))
    : 0;
}
