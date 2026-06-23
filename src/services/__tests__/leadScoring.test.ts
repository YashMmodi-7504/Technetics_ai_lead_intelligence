import { describe, it, expect } from "vitest";
import {
  computeLeadScore,
  leadBand,
  estimateOpportunityValue,
  opportunityTier,
} from "../../utils/leadScoring.js";
import type { Company } from "../../types.js";

function company(p: Partial<Company>): Company {
  return {
    id: "c1", name: "Acme", logo: "🏢", country: "Antarctica", countryCode: "",
    industry: "General", employees: 50, website: "", linkedin: "", aiScore: 0, leadScore: 0,
    status: "New Leads", description: "", techStack: [], services: [], locations: [],
    hiringActivity: "N/A", dataScienceScore: 0, powerBIScore: 0, cloudScore: 0, automationScore: 0,
    buyingIntentScore: 50, recommendedService: "", opportunityAnalysis: "", notes: [], activityTimeline: [],
    ...p,
  };
}

const FULL = {
  country: "United Arab Emirates", city: "Dubai", industry: "AI Consulting", employees: 600,
  website: "https://acme.ae", linkedin: "https://linkedin.com/company/acme",
  description: "AI and data consultancy.", generalEmail: "info@acme.ae", generalPhone: "+971-4-1",
};

describe("leadScoring V4 (size, industry, keywords, country, completeness)", () => {
  it("awards 100 when every factor is met", () => {
    expect(computeLeadScore(company(FULL))).toBe(100); // 35 +18 +12 +10 +10 +15
    expect(leadBand(100)).toBe("Hot");
  });

  it("returns the base 35 with no qualifying factors", () => {
    expect(computeLeadScore(company({}))).toBe(35);
    expect(leadBand(35)).toBe("Cold");
  });

  it("scores a complete small target-market firm", () => {
    const c = company({
      country: "Qatar", city: "Doha", industry: "Logistics", employees: 300,
      website: "x.qa", linkedin: "li", description: "Freight ops.", generalEmail: "a@x.qa", generalPhone: "+974",
    });
    expect(computeLeadScore(c)).toBe(60); // 35 +10 target +15 completeness
    expect(leadBand(60)).toBe("Medium");
  });

  it("bands map Hot/Warm/Medium/Cold", () => {
    expect(leadBand(80)).toBe("Hot");
    expect(leadBand(65)).toBe("Warm");
    expect(leadBand(64)).toBe("Medium");
    expect(leadBand(49)).toBe("Cold");
  });
});

describe("opportunity tiering (size)", () => {
  it("tiers by employee size", () => {
    expect(estimateOpportunityValue(company({ employees: 150 }))).toBe(10_000);
    expect(estimateOpportunityValue(company({ employees: 1001 }))).toBe(50_000);
    expect(opportunityTier(company({ employees: 2000 }))).toBe("Large");
  });
});
