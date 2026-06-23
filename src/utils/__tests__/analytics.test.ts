import { describe, it, expect } from "vitest";
import { computeAnalytics } from "../analytics";
import type { Company } from "../../types";

function mk(p: Partial<Company>): Company {
  return {
    id: p.name ?? Math.random().toString(),
    name: "Co", country: "", city: "", industry: "", leadScore: 0,
    website: "", linkedin: "", generalEmail: "", generalPhone: "", description: "",
    ...p,
  } as Company;
}

describe("centralized analytics service", () => {
  it("returns safe zeros for an empty dataset (no crash, no hardcoded counts)", () => {
    const a = computeAnalytics([]);
    expect(a.total).toBe(0);
    expect(a.countries).toEqual([]);
    expect(a.industries).toEqual([]);
    expect(a.marketRanking).toEqual([]);
    expect(a.coverage.overall).toBe(0);
    expect(a.topMarket).toBeUndefined();
  });

  it("generates countries and industries dynamically from the records", () => {
    const data = [
      mk({ country: "UAE", industry: "AI", city: "Dubai" }),
      mk({ country: "UAE", industry: "Cloud", city: "Dubai" }),
      mk({ country: "Qatar", industry: "AI", city: "Doha" }),
    ];
    const a = computeAnalytics(data);
    expect(a.total).toBe(3);
    expect(new Set(a.countries)).toEqual(new Set(["UAE", "Qatar"]));
    expect(new Set(a.industries)).toEqual(new Set(["AI", "Cloud"]));
    expect(a.countByCountry["UAE"]).toBe(2);
    expect(a.countByIndustry["AI"]).toBe(2);
    expect(a.cities).toContain("Dubai");
  });

  it("supports UNLIMITED brand-new countries & industries with no code changes", () => {
    const data = [
      mk({ country: "Atlantis", industry: "Quantum Computing" }),
      mk({ country: "Wakanda", industry: "Vibranium Mining" }),
      mk({ country: "Atlantis", industry: "Quantum Computing" }),
    ];
    const a = computeAnalytics(data);
    expect(a.countries).toContain("Atlantis");
    expect(a.countries).toContain("Wakanda");
    expect(a.industries).toContain("Quantum Computing");
    expect(a.industries).toContain("Vibranium Mining");
    expect(a.countByCountry["Atlantis"]).toBe(2);
    expect(a.topMarket?.country).toBe("Atlantis"); // most companies
  });

  it("collapses country aliases so a market is never split (UAE)", () => {
    const data = [
      mk({ country: "United Arab Emirates", industry: "AI" }),
      mk({ country: "UAE", industry: "AI" }),
    ];
    const a = computeAnalytics(data);
    expect(a.countByCountry["UAE"]).toBe(2);
    expect(a.countries).toEqual(["UAE"]);
  });

  it("auto-scores newly imported companies (no precomputed leadScore needed)", () => {
    const data = [mk({ country: "UAE", industry: "Artificial Intelligence", employees: 800, website: "x.com", linkedin: "l", generalEmail: "e@x.com", generalPhone: "1", city: "Dubai", description: "AI data analytics" })];
    const a = computeAnalytics(data);
    // base 35 + size + AI industry + keywords + target market + completeness → high
    expect(a.avgLeadScore).toBeGreaterThan(35);
    expect(a.bandCounts.Hot + a.bandCounts.Warm + a.bandCounts.Medium + a.bandCounts.Cold).toBe(1);
  });

  it("recomputes coverage from the actual records", () => {
    const data = [
      mk({ country: "UAE", website: "a.com", generalEmail: "a@a.com" }),
      mk({ country: "UAE", website: "b.com" }),
    ];
    const a = computeAnalytics(data);
    expect(a.coverage.website).toBe(100);
    expect(a.coverage.email).toBe(50);
    expect(a.coverage.phone).toBe(0);
  });

  it("recomputes everything when the dataset changes (no stale/hardcoded values)", () => {
    const first = computeAnalytics([mk({ country: "UAE", industry: "AI" })]);
    const second = computeAnalytics([
      mk({ country: "UAE", industry: "AI" }),
      mk({ country: "Norway", industry: "Energy" }),
      mk({ country: "Norway", industry: "Energy" }),
    ]);
    expect(first.total).toBe(1);
    expect(second.total).toBe(3);
    expect(second.topMarket?.country).toBe("Norway");
    expect(second.countries).toContain("Norway");
  });
});
