// Country Intelligence service (epic &1, Phase 1).
// Produces per-country demand scores across 8 dimensions, an overall demand
// score, a ranked skill list and recommended TECHNETICS services.
//
// Strategy: when the AIService can ground the assessment we use its scores;
// otherwise we fall back to a curated deterministic baseline for the 10 target
// countries (so the engine is useful with no API key and tests are stable).
import { aiService } from "./ai/index.js";
import {
  demandDimensionsSchema,
  type DemandDimensions,
} from "./ai/schemas.js";

export const DEMAND_DIMENSIONS = [
  "ai",
  "generativeAi",
  "machineLearning",
  "dataScience",
  "dataEngineering",
  "powerBI",
  "cloud",
  "automation",
] as const;

export type DemandDimension = (typeof DEMAND_DIMENSIONS)[number];

export interface SkillRanking {
  skill: DemandDimension;
  score: number;
  rank: number;
}

export interface CountryIntelligence {
  demandScores: DemandDimensions;
  demandOverall: number;
  skillRankings: SkillRanking[];
  recommendedServices: string[];
  topIndustries: string[];
  summary: string;
  source: "gemini" | "baseline";
}

// Curated baseline demand profiles for the 10 target countries (ISO code keys).
// Hand-tuned starting points; refined by AI grounding when available.
const BASELINES: Record<string, DemandDimensions> = {
  AE: { ai: 92, generativeAi: 90, machineLearning: 84, dataScience: 86, dataEngineering: 83, powerBI: 88, cloud: 90, automation: 85 },
  SA: { ai: 90, generativeAi: 88, machineLearning: 82, dataScience: 84, dataEngineering: 82, powerBI: 85, cloud: 89, automation: 86 },
  QA: { ai: 85, generativeAi: 83, machineLearning: 78, dataScience: 80, dataEngineering: 78, powerBI: 82, cloud: 84, automation: 80 },
  KW: { ai: 80, generativeAi: 78, machineLearning: 74, dataScience: 76, dataEngineering: 74, powerBI: 80, cloud: 80, automation: 78 },
  BH: { ai: 81, generativeAi: 79, machineLearning: 75, dataScience: 77, dataEngineering: 76, powerBI: 81, cloud: 83, automation: 79 },
  OM: { ai: 78, generativeAi: 75, machineLearning: 72, dataScience: 74, dataEngineering: 72, powerBI: 78, cloud: 79, automation: 76 },
  SG: { ai: 95, generativeAi: 93, machineLearning: 90, dataScience: 91, dataEngineering: 89, powerBI: 86, cloud: 93, automation: 88 },
  CH: { ai: 88, generativeAi: 85, machineLearning: 86, dataScience: 87, dataEngineering: 85, powerBI: 84, cloud: 86, automation: 83 },
  NO: { ai: 86, generativeAi: 83, machineLearning: 84, dataScience: 85, dataEngineering: 84, powerBI: 82, cloud: 88, automation: 85 },
  LU: { ai: 84, generativeAi: 82, machineLearning: 80, dataScience: 82, dataEngineering: 81, powerBI: 83, cloud: 85, automation: 82 },
};

const DEFAULT_DEMAND: DemandDimensions = {
  ai: 70, generativeAi: 68, machineLearning: 66, dataScience: 68,
  dataEngineering: 66, powerBI: 70, cloud: 72, automation: 68,
};

// Maps a demand dimension to the TECHNETICS service pitched against it.
const SERVICE_BY_DIMENSION: Record<DemandDimension, string> = {
  ai: "AI Agents & Custom AI Models",
  generativeAi: "Generative AI Enterprise Integration",
  machineLearning: "Machine Learning & Predictive Modeling",
  dataScience: "Data Science Consulting",
  dataEngineering: "Data Engineering & Pipelines",
  powerBI: "Power BI Executive Dashboards",
  cloud: "Cloud Solutions & Migration",
  automation: "Business Process Automation (RPA)",
};

export function rankSkills(demand: DemandDimensions): SkillRanking[] {
  return DEMAND_DIMENSIONS.map((skill) => ({ skill, score: demand[skill] }))
    .sort((a, b) => b.score - a.score)
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
}

export function overallDemand(demand: DemandDimensions): number {
  const total = DEMAND_DIMENSIONS.reduce((sum, d) => sum + demand[d], 0);
  return Math.round(total / DEMAND_DIMENSIONS.length);
}

// Top-N ranked skills mapped to their TECHNETICS service (deduped, order kept).
export function recommendedServices(
  rankings: SkillRanking[],
  count = 3,
): string[] {
  const out: string[] = [];
  for (const r of rankings) {
    const svc = SERVICE_BY_DIMENSION[r.skill];
    if (!out.includes(svc)) out.push(svc);
    if (out.length >= count) break;
  }
  return out;
}

export function baselineFor(isoCode: string | null | undefined): DemandDimensions {
  if (isoCode && BASELINES[isoCode.toUpperCase()]) {
    return BASELINES[isoCode.toUpperCase()];
  }
  return DEFAULT_DEMAND;
}

export class CountryIntelligenceService {
  // Generate intelligence for a country. `isoCode` selects the deterministic
  // baseline; AI grounding refines it when a client is configured.
  async generate(
    name: string,
    isoCode?: string | null,
  ): Promise<CountryIntelligence> {
    const baseline = baselineFor(isoCode);
    let demand: DemandDimensions = baseline;
    let topIndustries: string[] = [];
    let summary = `Baseline demand assessment for ${name}.`;
    let source: "gemini" | "baseline" = "baseline";

    const ai = await aiService.analyzeCountryDemand(name);
    if (ai) {
      // Blend AI with baseline (average) to avoid wild single-call swings.
      const parsed = demandDimensionsSchema.safeParse(ai.data.demand);
      if (parsed.success) {
        demand = blend(baseline, parsed.data);
        topIndustries = ai.data.topIndustries;
        summary = ai.data.summary;
        source = "gemini";
      }
    }

    const skillRankings = rankSkills(demand);
    return {
      demandScores: demand,
      demandOverall: overallDemand(demand),
      skillRankings,
      recommendedServices: recommendedServices(skillRankings),
      topIndustries,
      summary,
      source,
    };
  }
}

function blend(a: DemandDimensions, b: DemandDimensions): DemandDimensions {
  const out = {} as DemandDimensions;
  for (const d of DEMAND_DIMENSIONS) {
    out[d] = Math.round((a[d] + b[d]) / 2);
  }
  return out;
}

export const countryIntelligenceService = new CountryIntelligenceService();
