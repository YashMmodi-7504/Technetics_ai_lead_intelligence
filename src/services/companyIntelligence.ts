// Company Intelligence service (epic &1, Phase 2).
// Scores a consulting company for AI readiness, the 5 technology demand
// dimensions, and an overall opportunity score — integrating Phase 1 country
// demand as a market multiplier and AIService company analysis as a signal.
import { aiService } from "./ai/index.js";
import type { DemandDimensions } from "./ai/schemas.js";

export interface CompanyScoreInput {
  name: string;
  domain?: string | null;
  industry?: string | null;
  employeeCount?: number | null;
}

export interface CompanyScores {
  aiReadinessScore: number;
  dataScienceScore: number;
  dataEngineeringScore: number;
  powerBiScore: number;
  cloudScore: number;
  automationScore: number;
  opportunityScore: number;
  source: "gemini" | "baseline";
  techStack: string[];
  hiringNeeds: string[];
}

// Industry affinity (0-1) per technology dimension. Higher = the industry
// typically has stronger need for that service line.
type Dimension =
  | "dataScience"
  | "dataEngineering"
  | "powerBI"
  | "cloud"
  | "automation";

const INDUSTRY_AFFINITY: Record<string, Record<Dimension, number>> = {
  logistics: { dataScience: 0.7, dataEngineering: 0.8, powerBI: 0.9, cloud: 0.8, automation: 0.9 },
  biotech: { dataScience: 0.95, dataEngineering: 0.9, powerBI: 0.6, cloud: 0.85, automation: 0.7 },
  finance: { dataScience: 0.85, dataEngineering: 0.8, powerBI: 0.95, cloud: 0.85, automation: 0.8 },
  insurance: { dataScience: 0.7, dataEngineering: 0.7, powerBI: 0.85, cloud: 0.75, automation: 0.9 },
  mining: { dataScience: 0.6, dataEngineering: 0.7, powerBI: 0.85, cloud: 0.65, automation: 0.8 },
  retail: { dataScience: 0.85, dataEngineering: 0.85, powerBI: 0.8, cloud: 0.9, automation: 0.85 },
  manufacturing: { dataScience: 0.75, dataEngineering: 0.8, powerBI: 0.8, cloud: 0.75, automation: 0.95 },
};

const DEFAULT_AFFINITY: Record<Dimension, number> = {
  dataScience: 0.7,
  dataEngineering: 0.7,
  powerBI: 0.75,
  cloud: 0.75,
  automation: 0.75,
};

function affinityFor(industry?: string | null): Record<Dimension, number> {
  if (!industry) return DEFAULT_AFFINITY;
  const key = industry.toLowerCase();
  for (const k of Object.keys(INDUSTRY_AFFINITY)) {
    if (key.includes(k)) return INDUSTRY_AFFINITY[k];
  }
  return DEFAULT_AFFINITY;
}

// Larger orgs => more budget/complexity => higher demand. 0.6..1.0 multiplier.
export function sizeMultiplier(employeeCount?: number | null): number {
  const n = employeeCount ?? 0;
  if (n >= 10000) return 1.0;
  if (n >= 1000) return 0.92;
  if (n >= 250) return 0.82;
  if (n >= 50) return 0.72;
  return 0.6;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

// A single dimension score blends country demand (market pull) with company
// industry affinity and size (company-specific fit).
export function dimensionScore(
  countryDemand: number,
  affinity: number,
  size: number,
): number {
  // 50% market, 35% industry fit, 15% size.
  return clamp(countryDemand * 0.5 + affinity * 100 * 0.35 + size * 100 * 0.15);
}

// Tech-stack keywords that boost AI readiness when detected. Multi-letter,
// specific tokens only — short tokens like "ai"/"ml" are matched as whole
// words below to avoid false positives (e.g. "email" contains "ai").
const AI_STACK_SIGNALS = [
  "python",
  "pytorch",
  "tensorflow",
  "cognitive",
  "bigquery",
  "databricks",
  "openai",
  "gemini",
];
const AI_STACK_WORDS = ["ai", "ml", "llm", "genai"];

function matchesAiSignal(tech: string): boolean {
  const lower = tech.toLowerCase();
  if (AI_STACK_SIGNALS.some((s) => lower.includes(s))) return true;
  // Whole-word match for short ambiguous tokens.
  const words = lower.split(/[^a-z0-9]+/);
  return words.some((w) => AI_STACK_WORDS.includes(w));
}

export function aiReadiness(
  countryDemand: DemandDimensions,
  size: number,
  techStack: string[],
): number {
  const marketAi =
    (countryDemand.ai + countryDemand.generativeAi + countryDemand.machineLearning) /
    3;
  const stackHits = techStack.filter(matchesAiSignal).length;
  const stackBoost = Math.min(stackHits * 4, 20); // up to +20
  return clamp(marketAi * 0.6 + size * 100 * 0.2 + stackBoost);
}

export class CompanyIntelligenceService {
  async score(
    input: CompanyScoreInput,
    countryDemand: DemandDimensions,
  ): Promise<CompanyScores> {
    const affinity = affinityFor(input.industry);
    const size = sizeMultiplier(input.employeeCount);

    let techStack: string[] = [];
    let hiringNeeds: string[] = [];
    let source: "gemini" | "baseline" = "baseline";

    const ai = await aiService.analyzeCompany(
      input.name,
      input.domain ?? "",
      input.industry ?? "",
    );
    if (ai) {
      techStack = ai.data.likelyTechStack;
      hiringNeeds = ai.data.hiringNeeds;
      source = "gemini";
    }

    const dataScienceScore = dimensionScore(
      countryDemand.dataScience,
      affinity.dataScience,
      size,
    );
    const dataEngineeringScore = dimensionScore(
      countryDemand.dataEngineering,
      affinity.dataEngineering,
      size,
    );
    const powerBiScore = dimensionScore(
      countryDemand.powerBI,
      affinity.powerBI,
      size,
    );
    const cloudScore = dimensionScore(
      countryDemand.cloud,
      affinity.cloud,
      size,
    );
    const automationScore = dimensionScore(
      countryDemand.automation,
      affinity.automation,
      size,
    );
    const aiReadinessScore = aiReadiness(countryDemand, size, techStack);

    const demandAvg =
      (dataScienceScore +
        dataEngineeringScore +
        powerBiScore +
        cloudScore +
        automationScore) /
      5;
    const countryOverall =
      (countryDemand.ai +
        countryDemand.generativeAi +
        countryDemand.machineLearning +
        countryDemand.dataScience +
        countryDemand.dataEngineering +
        countryDemand.powerBI +
        countryDemand.cloud +
        countryDemand.automation) /
      8;

    // Opportunity: 40% AI readiness, 40% demand fit, 20% country market.
    const opportunityScore = clamp(
      aiReadinessScore * 0.4 + demandAvg * 0.4 + countryOverall * 0.2,
    );

    return {
      aiReadinessScore,
      dataScienceScore,
      dataEngineeringScore,
      powerBiScore,
      cloudScore,
      automationScore,
      opportunityScore,
      source,
      techStack,
      hiringNeeds,
    };
  }
}

export const companyIntelligenceService = new CompanyIntelligenceService();
