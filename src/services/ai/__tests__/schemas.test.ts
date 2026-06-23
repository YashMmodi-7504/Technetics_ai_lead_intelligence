import { describe, it, expect } from "vitest";
import {
  leadScoreSchema,
  countryAnalysisSchema,
  companyAnalysisSchema,
} from "../schemas";

describe("schemas", () => {
  it("accepts valid lead score payloads", () => {
    expect(
      leadScoreSchema.safeParse({ recommendations: ["a", "b"] }).success,
    ).toBe(true);
  });

  it("rejects empty recommendations", () => {
    expect(leadScoreSchema.safeParse({ recommendations: [] }).success).toBe(
      false,
    );
  });

  it("rejects out-of-range opportunityScore", () => {
    const bad = countryAnalysisSchema.safeParse({
      summary: "s",
      gdpOutlook: "g",
      englishProficiency: "high",
      topIndustries: ["x"],
      opportunityScore: 150,
    });
    expect(bad.success).toBe(false);
  });

  it("accepts a valid company analysis", () => {
    expect(
      companyAnalysisSchema.safeParse({
        summary: "s",
        likelyTechStack: ["Azure"],
        hiringNeeds: ["data"],
      }).success,
    ).toBe(true);
  });
});
