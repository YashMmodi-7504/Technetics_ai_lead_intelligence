import { describe, it, expect } from "vitest";
import { buildQualityReport } from "../importQuality.js";
import type { ParsedLead } from "../leadCsvParser.js";

function lead(partial: Partial<ParsedLead>, i: number): ParsedLead {
  return {
    companyName: "",
    companyWebsite: "",
    companyLinkedin: "",
    companyIndustry: "",
    companyEmployees: 0,
    companyCountry: "",
    companyCountryCode: "",
    firstName: "",
    lastName: "",
    fullName: "",
    role: "",
    email: "",
    linkedin: "",
    seniority: "",
    rowIndex: i,
    ...partial,
  };
}

describe("importQuality", () => {
  const leads: ParsedLead[] = [
    lead({ companyName: "Acme", fullName: "Jane Doe", role: "CTO", email: "jane@acme.com", companyCountry: "United States", companyEmployees: 200 }, 1),
    lead({ companyName: "Acme", fullName: "John Roe", role: "VP of Engineering", email: "john@acme.com" }, 2), // dup company
    lead({ companyName: "Globex", fullName: "Sam Lee", role: "regional widget wrangler" }, 3), // unmatched title, no email
  ];

  const report = buildQualityReport(leads, "apollo", ["email status", "seniority"], 0, 1);

  it("computes field completeness", () => {
    expect(report.completeness.company).toBe(100);
    expect(report.completeness.email).toBe(67); // 2 of 3
    expect(report.completeness.title).toBe(100);
  });

  it("detects in-file duplicate companies", () => {
    expect(report.duplicatesInFile.companies).toBe(1); // second Acme
  });

  it("measures title normalization coverage", () => {
    // CTO + VP Engineering matched, widget wrangler unmatched → 2/3 ≈ 67%
    expect(report.titleNormalization.normalized).toBe(2);
    expect(report.titleNormalization.unmatched).toBe(1);
    expect(report.titleNormalization.coverage).toBe(67);
  });

  it("reports source detection confidence with matched signals", () => {
    expect(report.sourceDetection.provider).toBe("apollo");
    expect(report.sourceDetection.matchedSignals).toContain("email status");
    expect(report.sourceDetection.confidence).toBeGreaterThanOrEqual(70);
  });

  it("produces a score, grade, and warnings", () => {
    expect(report.score).toBeGreaterThan(0);
    expect(["A", "B", "C", "D"]).toContain(report.grade);
    expect(report.warnings.length).toBeGreaterThan(0);
    expect(report.validRows).toBe(3);
    expect(report.totalRows).toBe(4); // 3 valid + 1 skipped
  });
});
