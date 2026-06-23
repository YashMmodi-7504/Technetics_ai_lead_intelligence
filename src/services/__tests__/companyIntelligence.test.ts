import { describe, it, expect } from "vitest";
import {
  sizeMultiplier,
  dimensionScore,
  aiReadiness,
} from "../companyIntelligence";
import type { DemandDimensions } from "../ai/schemas";

const demand: DemandDimensions = {
  ai: 90,
  generativeAi: 88,
  machineLearning: 84,
  dataScience: 86,
  dataEngineering: 82,
  powerBI: 88,
  cloud: 90,
  automation: 85,
};

describe("companyIntelligence scoring", () => {
  it("size multiplier increases with headcount and is bounded", () => {
    expect(sizeMultiplier(5)).toBe(0.6);
    expect(sizeMultiplier(15000)).toBe(1.0);
    expect(sizeMultiplier(500)).toBeGreaterThan(sizeMultiplier(60));
    expect(sizeMultiplier(null)).toBe(0.6);
  });

  it("dimensionScore blends market, affinity and size into 0-100", () => {
    const s = dimensionScore(90, 0.9, 1.0);
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThanOrEqual(100);
    // higher country demand => higher score
    expect(dimensionScore(90, 0.9, 1.0)).toBeGreaterThan(
      dimensionScore(40, 0.9, 1.0),
    );
  });

  it("aiReadiness rewards AI tech-stack signals", () => {
    const withStack = aiReadiness(demand, 1.0, [
      "Python",
      "PyTorch",
      "Azure Cognitive Services",
    ]);
    const without = aiReadiness(demand, 1.0, ["Excel"]);
    expect(withStack).toBeGreaterThan(without);
    expect(withStack).toBeLessThanOrEqual(100);
  });

  it("does not falsely match short tokens inside unrelated words", () => {
    // 'email' contains 'ai' but must not count as an AI signal.
    const emailOnly = aiReadiness(demand, 0.6, ["Email", "Outlook"]);
    const aiWord = aiReadiness(demand, 0.6, ["AI Platform"]);
    expect(aiWord).toBeGreaterThan(emailOnly);
  });
});
