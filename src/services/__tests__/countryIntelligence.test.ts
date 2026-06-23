import { describe, it, expect } from "vitest";
import {
  rankSkills,
  overallDemand,
  recommendedServices,
  baselineFor,
  DEMAND_DIMENSIONS,
} from "../countryIntelligence";
import type { DemandDimensions } from "../ai/schemas";

const demand: DemandDimensions = {
  ai: 90,
  generativeAi: 95,
  machineLearning: 60,
  dataScience: 70,
  dataEngineering: 50,
  powerBI: 88,
  cloud: 80,
  automation: 40,
};

describe("countryIntelligence scoring", () => {
  it("ranks skills descending with 1-based ranks", () => {
    const ranked = rankSkills(demand);
    expect(ranked).toHaveLength(DEMAND_DIMENSIONS.length);
    expect(ranked[0].skill).toBe("generativeAi");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[ranked.length - 1].skill).toBe("automation");
    // monotonically non-increasing scores
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
    }
  });

  it("computes overall demand as the rounded average", () => {
    expect(overallDemand(demand)).toBe(72); // (90+95+60+70+50+88+80+40)/8 = 71.6
  });

  it("recommends the services mapped to the top skills, deduped", () => {
    const svcs = recommendedServices(rankSkills(demand), 3);
    expect(svcs).toHaveLength(3);
    expect(svcs[0]).toBe("Generative AI Enterprise Integration");
    expect(new Set(svcs).size).toBe(3);
  });

  it("returns a curated baseline for a known ISO code", () => {
    const sg = baselineFor("SG");
    expect(sg.ai).toBeGreaterThan(90);
    expect(baselineFor("sg").ai).toBe(sg.ai); // case-insensitive
  });

  it("falls back to the default baseline for an unknown ISO code", () => {
    const unknown = baselineFor("ZZ");
    expect(unknown.ai).toBe(70);
  });
});
