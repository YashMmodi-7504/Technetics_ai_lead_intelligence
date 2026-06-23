import { describe, it, expect } from "vitest";
import { runAssistantQuery, matchesToCsv } from "../assistantEngine";
import type { Company } from "../../types";

// Minimal synthetic dataset covering the markets/sectors the prompts target.
// Only the fields the engine reads are populated; the rest are cast in.
function mk(partial: Partial<Company>): Company {
  return {
    id: partial.name ?? Math.random().toString(),
    name: "",
    country: "",
    city: "",
    industry: "",
    leadScore: 50,
    website: "",
    linkedin: "",
    generalEmail: "",
    generalPhone: "",
    description: "",
    ...partial,
  } as Company;
}

const DATA: Company[] = [
  mk({ id: "1", name: "Falcon AI", country: "UAE", city: "Dubai", industry: "Artificial Intelligence", leadScore: 92, linkedin: "x", generalEmail: "a@f.ai" }),
  mk({ id: "2", name: "Desert Data Science", country: "UAE", city: "Abu Dhabi", industry: "Data Science Consulting", leadScore: 88, generalEmail: "b@d.ai" }),
  mk({ id: "3", name: "Gulf Cyber Shield", country: "UAE", city: "Dubai", industry: "Cybersecurity", leadScore: 81 }),
  mk({ id: "4", name: "Oasis Cloud", country: "UAE", city: "Dubai", industry: "Cloud Infrastructure", leadScore: 74, linkedin: "y" }),
  mk({ id: "5", name: "Riyadh Cloud Advisors", country: "Saudi Arabia", city: "Riyadh", industry: "Cloud Consulting", leadScore: 84 }),
  mk({ id: "6", name: "KSA Consult Group", country: "Saudi Arabia", city: "Jeddah", industry: "Management Consulting", leadScore: 67 }),
  mk({ id: "7", name: "Manama Advisory", country: "Bahrain", city: "Manama", industry: "Consulting", leadScore: 71 }),
  mk({ id: "8", name: "Bahrain FinTech Co", country: "Bahrain", city: "Manama", industry: "Fintech", leadScore: 63 }),
  mk({ id: "9", name: "Nordic Analytics", country: "Norway", city: "Oslo", industry: "Data & Analytics", leadScore: 59, linkedin: "z" }),
];

describe("assistant query engine — suggested prompts", () => {
  it("Find AI consulting companies in UAE → company-discovery, UAE, AI keywords, real matches", () => {
    const r = runAssistantQuery("Find AI consulting companies in UAE", DATA);
    const view = r.actions.find((a) => a.kind === "view");
    expect(view?.directive?.target).toBe("company-discovery");
    expect(view?.directive?.country).toBe("UAE");
    expect(view?.directive?.industryKeywords).toContain("artificial intelligence");
    // only UAE AI/consulting firms, never another country
    expect(r.matches.length).toBeGreaterThan(0);
    expect(r.matches.every((c) => c.country === "UAE")).toBe(true);
    expect(r.answer).toMatch(/companies/i);
  });

  it("Show top CTO opportunities → company-discovery sorted by score", () => {
    const r = runAssistantQuery("Show top CTO opportunities", DATA);
    const view = r.actions.find((a) => a.kind === "view");
    expect(view?.directive?.target).toBe("company-discovery");
    expect(view?.directive?.sort).toBe("score-desc");
    // sorted highest score first
    expect(r.matches[0].leadScore).toBe(92);
  });

  it("Generate outreach for top leads → outreach-studio with preloaded company ids", () => {
    const r = runAssistantQuery("Generate outreach for top leads", DATA);
    const outreach = r.actions.find((a) => a.kind === "outreach");
    expect(outreach?.directive?.target).toBe("outreach-studio");
    expect(outreach?.directive?.companyIds?.length).toBeGreaterThan(0);
    expect(outreach?.directive?.companyIds?.[0]).toBe("1"); // top scorer
  });

  it("Show highest intent accounts → ai-lead-scoring, Hot, score ≥ 80", () => {
    const r = runAssistantQuery("Show highest intent accounts", DATA);
    const score = r.actions.find((a) => a.kind === "score");
    expect(score?.directive?.target).toBe("ai-lead-scoring");
    expect(score?.directive?.band).toBe("Hot");
    expect(score?.directive?.minScore).toBe(80);
    expect(r.matches.every((c) => c.leadScore >= 80)).toBe(true);
  });
});

describe("assistant query engine — free-text chatbot", () => {
  it("Find cloud consulting companies in Saudi Arabia", () => {
    const r = runAssistantQuery("Find cloud consulting companies in Saudi Arabia", DATA);
    expect(r.matches.length).toBeGreaterThan(0);
    expect(r.matches.every((c) => c.country === "Saudi Arabia")).toBe(true);
    expect(r.matches.some((c) => /cloud/i.test(c.industry))).toBe(true);
  });

  it("Show cybersecurity firms in UAE", () => {
    const r = runAssistantQuery("Show cybersecurity firms in UAE", DATA);
    expect(r.matches.some((c) => c.name === "Gulf Cyber Shield")).toBe(true);
    expect(r.matches.every((c) => c.country === "UAE")).toBe(true);
  });

  it("Which country has most consulting firms? → aggregation bullets, no blank route", () => {
    const r = runAssistantQuery("Which country has most consulting firms?", DATA);
    expect(r.bullets && r.bullets.length).toBeGreaterThan(0);
    expect(r.answer).toMatch(/most/i);
    // every result must carry a usable action or stay in-panel (never blank)
    expect(Array.isArray(r.actions)).toBe(true);
  });

  it("Top industries in Bahrain → industry breakdown for Bahrain only", () => {
    const r = runAssistantQuery("Top industries in Bahrain", DATA);
    expect(r.bullets && r.bullets.length).toBeGreaterThan(0);
    expect(r.answer).toMatch(/Bahrain/);
  });

  it("Companies with missing LinkedIn profiles → stays in-panel, real records", () => {
    const r = runAssistantQuery("Companies with missing LinkedIn profiles", DATA);
    // companies without linkedin in the dataset: ids 2,3,5,6,7,8
    expect(r.matches.length).toBe(6);
    expect(r.matches.every((c) => !c.linkedin)).toBe(true);
    // no navigation directive → answered inside the panel (no blank page)
    expect(r.actions.every((a) => a.kind === "export")).toBe(true);
  });

  it("never returns an undefined answer (no blank responses)", () => {
    for (const q of [
      "hello", "asdfqwer", "companies", "top", "UAE", "show me everything", "",
    ]) {
      const r = runAssistantQuery(q, DATA);
      expect(typeof r.answer).toBe("string");
      expect(r.answer.length).toBeGreaterThan(0);
      expect(Array.isArray(r.actions)).toBe(true);
    }
  });

  it("empty dataset returns a helpful message, not a crash", () => {
    const r = runAssistantQuery("Find AI companies in UAE", []);
    expect(r.answer).toMatch(/no company records/i);
    expect(r.matches).toEqual([]);
  });
});

describe("assistant query engine — V4 copilot examples", () => {
  const BIG: Company[] = [
    mk({ id: "b1", name: "MegaCorp Gulf", country: "UAE", industry: "Technology", employees: 5000, leadScore: 90 }),
    mk({ id: "b2", name: "MidCo", country: "UAE", industry: "Technology", employees: 300, leadScore: 60 }),
    mk({ id: "b3", name: "BigBank KSA", country: "Saudi Arabia", industry: "Fintech", employees: 2000, leadScore: 70 }),
  ];

  it("Show companies above 1000 employees → size filter, real records only", () => {
    const r = runAssistantQuery("Show companies above 1000 employees", BIG);
    expect(r.matches.every((c) => c.employees >= 1000)).toBe(true);
    expect(r.matches.map((c) => c.id).sort()).toEqual(["b1", "b3"]);
    expect(r.answer).toMatch(/1,000\+ employees/);
  });

  it("Generate outreach for Falcon AI → targets that exact company", () => {
    const data = [...BIG, mk({ id: "f1", name: "Falcon AI", country: "UAE", industry: "Artificial Intelligence", leadScore: 95 })];
    const r = runAssistantQuery("Generate outreach for Falcon AI", data);
    const outreach = r.actions.find((a) => a.kind === "outreach");
    expect(outreach?.directive?.companyIds).toEqual(["f1"]);
    expect(r.matches[0].name).toBe("Falcon AI");
  });

  it("Best country for AI consulting opportunities → country ranking", () => {
    const r = runAssistantQuery("Best country for AI consulting opportunities", DATA);
    expect(r.bullets && r.bullets.length).toBeGreaterThan(0);
    expect(r.answer).toMatch(/most/i);
  });
});

describe("CSV export", () => {
  it("produces a header row plus one row per match", () => {
    const csv = matchesToCsv(DATA.slice(0, 3));
    const lines = csv.split("\n");
    expect(lines[0]).toContain("Name");
    expect(lines.length).toBe(4); // header + 3
  });
});
