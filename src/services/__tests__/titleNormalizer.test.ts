import { describe, it, expect } from "vitest";
import { normalizeTitle, priorityForSeniority } from "../titleNormalizer.js";

describe("titleNormalizer", () => {
  it("maps common C-level variants to canonical roles", () => {
    expect(normalizeTitle("Chief Technology Officer").canonical).toBe("CTO");
    expect(normalizeTitle("cto").canonical).toBe("CTO");
    expect(normalizeTitle("Chief Executive Officer").canonical).toBe("CEO");
    expect(normalizeTitle("CFO").canonical).toBe("CFO");
    expect(normalizeTitle("Chief Data Officer").canonical).toBe("Chief Data Officer");
    expect(normalizeTitle("Chief AI Officer").canonical).toBe("Chief AI Officer");
  });

  it("detects founders and heads", () => {
    expect(normalizeTitle("Co-Founder & CEO").canonical).toBe("CEO"); // CEO rule wins (listed first)
    expect(normalizeTitle("Founder").seniority).toBe("Founder");
    expect(normalizeTitle("Head of Data Science").canonical).toBe("Head of Data");
    expect(normalizeTitle("Head of Machine Learning").canonical).toBe("Head of AI");
  });

  it("classifies seniority tiers", () => {
    expect(normalizeTitle("VP of Engineering").seniority).toBe("VP");
    expect(normalizeTitle("VP of Engineering").canonical).toBe("VP Engineering");
    expect(normalizeTitle("Director of Data").seniority).toBe("Director");
    expect(normalizeTitle("Senior Software Engineer").seniority).toBe("Senior");
    expect(normalizeTitle("Marketing Manager").seniority).toBe("Manager");
    expect(normalizeTitle("Marketing Intern").seniority).toBe("Entry");
  });

  it("assigns departments", () => {
    expect(normalizeTitle("Head of Data Science").department).toBe("Data & AI");
    expect(normalizeTitle("Senior Software Engineer").department).toBe("Technology");
    expect(normalizeTitle("VP of Sales").department).toBe("Sales");
    expect(normalizeTitle("CFO").department).toBe("Finance");
  });

  it("falls back to title-case for unknown titles and flags unmatched", () => {
    const r = normalizeTitle("regional widget wrangler");
    expect(r.matched).toBe(false);
    expect(r.canonical).toBe("Regional Widget Wrangler");
  });

  it("handles empty input safely", () => {
    const r = normalizeTitle("");
    expect(r.canonical).toBe("Contact");
    expect(r.seniority).toBe("Unknown");
    expect(r.matched).toBe(false);
  });

  it("maps seniority tiers to descending priority scores", () => {
    expect(priorityForSeniority("Founder")).toBeGreaterThanOrEqual(priorityForSeniority("VP"));
    expect(priorityForSeniority("VP")).toBeGreaterThan(priorityForSeniority("Manager"));
    expect(priorityForSeniority("Manager")).toBeGreaterThan(priorityForSeniority("Entry"));
  });
});
