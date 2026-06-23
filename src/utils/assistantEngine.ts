// TECHNETICS AI assistant — a deterministic query engine over the IMPORTED
// company dataset. No hallucination: every answer is computed from real records.
import type { Company } from "../types";
import { normalizeCountry, hasLinkedin, hasEmail, hasPhone, countryFlag } from "./dataQuality";
import { leadBand, normalizedEmployees, type LeadBand } from "./leadScoring";

export type AssistantTarget = "company-discovery" | "ai-lead-scoring" | "outreach-studio";

/** A navigation + filter instruction the assistant hands to a page. */
export interface AssistantDirective {
  target: AssistantTarget;
  country?: string;            // "" clears the global country filter
  industryKeywords?: string[]; // OR-match: industry contains any keyword
  sort?: "score-desc" | "size-desc";
  search?: string;
  band?: LeadBand;
  minScore?: number;
  companyIds?: string[];       // explicit pre-selection (e.g. top leads)
}

export type AssistantActionKind = "view" | "outreach" | "score" | "export";

export interface AssistantAction {
  label: string;
  kind: AssistantActionKind;
  directive?: AssistantDirective; // nav actions carry a directive; export does not
  primary?: boolean;
}

export interface AssistantResult {
  answer: string;          // natural-language headline
  matches: Company[];      // real matched records (may be empty)
  bullets?: string[];      // ranked aggregation lines (country/industry breakdowns)
  actions: AssistantAction[];
  note?: string;           // optional secondary line
}

// ── Country detection ────────────────────────────────────────────────────────
const COUNTRY_HINTS: Array<[RegExp, string]> = [
  [/\bunited arab emirates\b|\bemirates\b|\bu\.?a\.?e\.?\b|\buae\b/, "UAE"],
  [/\bsaudi arabia\b|\bksa\b|\bsaudi\b/, "Saudi Arabia"],
  [/\bqatar\b/, "Qatar"],
  [/\bkuwait\b/, "Kuwait"],
  [/\boman\b/, "Oman"],
  [/\bbahrain\b/, "Bahrain"],
  [/\bsingapore\b/, "Singapore"],
  [/\bswitzerland\b|\bswiss\b/, "Switzerland"],
  [/\bnorway\b|\bnorwegian\b/, "Norway"],
  [/\bluxembourg\b/, "Luxembourg"],
];

function detectCountry(q: string, available: Set<string>): string | undefined {
  for (const [re, canonical] of COUNTRY_HINTS) {
    if (re.test(q) && available.has(canonical)) return canonical;
  }
  // Fall back to any dataset country mentioned verbatim.
  for (const c of available) {
    if (c.length > 2 && q.includes(c.toLowerCase())) return c;
  }
  return undefined;
}

// ── Industry keyword groups (OR-matched against company.industry) ──────────────
const INDUSTRY_GROUPS: Array<{ test: RegExp; keywords: string[]; label: string }> = [
  { test: /\b(ai|a\.i\.|artificial intelligence|machine learning|deep learning|data science)\b/, keywords: ["ai", "artificial intelligence", "data science", "machine learning"], label: "AI" },
  { test: /\bcloud\b/, keywords: ["cloud"], label: "Cloud" },
  { test: /\b(cyber|cybersecurity|infosec|security)\b/, keywords: ["cyber", "security"], label: "Cybersecurity" },
  { test: /\b(fintech|financial|finance|banking|bank)\b/, keywords: ["fintech", "financ", "bank"], label: "Finance" },
  { test: /\b(consult|advisory|advisor)\b/, keywords: ["consult", "advisory"], label: "Consulting" },
  { test: /\b(data|analytics|analytic)\b/, keywords: ["data", "analytic"], label: "Data & Analytics" },
  { test: /\b(software|saas|technology|tech|ict|it services)\b/, keywords: ["software", "saas", "tech", "ict"], label: "Technology" },
  { test: /\b(health|healthcare|medical|pharma|biotech)\b/, keywords: ["health", "medical", "pharma", "bio"], label: "Healthcare" },
  { test: /\b(engineering|engineer|industrial|manufactur)\b/, keywords: ["engineer", "industrial", "manufactur"], label: "Engineering" },
  { test: /\b(energy|oil|gas|renewable|solar)\b/, keywords: ["energy", "oil", "gas", "renewable", "solar"], label: "Energy" },
  { test: /\b(logistic|supply chain|freight|shipping)\b/, keywords: ["logistic", "supply", "freight", "shipping"], label: "Logistics" },
  { test: /\b(real estate|property|construction)\b/, keywords: ["real estate", "property", "construction"], label: "Real Estate" },
  { test: /\b(retail|ecommerce|e-commerce|commerce)\b/, keywords: ["retail", "commerce"], label: "Retail" },
  { test: /\b(telecom|telco|communications)\b/, keywords: ["telecom", "communication"], label: "Telecom" },
];

function detectIndustry(q: string): { keywords: string[]; labels: string[] } {
  const keywords: string[] = [];
  const labels: string[] = [];
  for (const g of INDUSTRY_GROUPS) {
    if (g.test.test(q)) {
      keywords.push(...g.keywords);
      labels.push(g.label);
    }
  }
  return { keywords: Array.from(new Set(keywords)), labels: Array.from(new Set(labels)) };
}

const industryMatches = (c: Company, keywords: string[]) => {
  if (!keywords.length) return true;
  const ind = (c.industry || "").toLowerCase();
  return keywords.some((k) => ind.includes(k));
};

// Detect an employee-size threshold, e.g. "above 1000 employees", "1000+ staff".
function detectMinEmployees(q: string): number | undefined {
  const m =
    q.match(/(?:above|over|more than|greater than|at least|>=?|min(?:imum)?)\s*([\d,]+)\s*(?:\+)?\s*(?:employees|staff|people|headcount|workers)?/) ||
    q.match(/([\d,]+)\s*\+\s*(?:employees|staff|people|headcount|workers)/) ||
    q.match(/([\d,]+)\s*(?:employees|staff|people|headcount|workers)/);
  if (!m) return undefined;
  const n = parseInt(m[1].replace(/,/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

// Detect a specific company referenced by name (longest match wins).
function detectCompany(q: string, companies: Company[]): Company | undefined {
  let best: Company | undefined;
  for (const c of companies) {
    const name = (c.name || "").toLowerCase().trim();
    if (name.length > 3 && q.includes(name)) {
      if (!best || name.length > best.name.length) best = c;
    }
  }
  return best;
}

const byScore = (a: Company, b: Company) => b.leadScore - a.leadScore;
const TOP_N = 5;

function listLabel(country?: string, labels?: string[]): string {
  const parts: string[] = [];
  if (labels && labels.length) parts.push(labels.join(" / "));
  parts.push("companies");
  if (country) parts.push(`in ${country}`);
  return parts.join(" ");
}

// ── Aggregations ───────────────────────────────────────────────────────────────
function groupCount(companies: Company[], key: (c: Company) => string): Array<[string, number]> {
  const m: Record<string, number> = {};
  companies.forEach((c) => { const k = key(c) || "Unknown"; m[k] = (m[k] || 0) + 1; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

// ── Main entry ─────────────────────────────────────────────────────────────────
export function runAssistantQuery(rawQuery: string, companies: Company[]): AssistantResult {
  const q = rawQuery.toLowerCase().trim();
  const availableCountries = new Set(companies.map((c) => normalizeCountry(c.country)).filter(Boolean));

  if (companies.length === 0) {
    return {
      answer: "No company records are loaded yet. Import a CSV to start querying your market intelligence.",
      matches: [],
      actions: [{ label: "Go to Lead Import", kind: "view", directive: { target: "company-discovery" } }],
    };
  }

  const country = detectCountry(q, availableCountries);
  const { keywords, labels } = detectIndustry(q);

  const exportAction = (set: Company[]): AssistantAction[] =>
    set.length ? [{ label: "Export Results", kind: "export" }] : [];

  // 1) Aggregation — "which country has most …" / "best country for …"
  if (/which country|country has most|most companies|countries by|top countr|best country|best market/.test(q)) {
    const pool = keywords.length ? companies.filter((c) => industryMatches(c, keywords)) : companies;
    const ranked = groupCount(pool, (c) => normalizeCountry(c.country));
    const top = ranked[0];
    const scope = labels.length ? `${labels.join(" / ")} ` : "";
    return {
      answer: top
        ? `${top[0]} has the most ${scope}companies — ${top[1]} of ${pool.length}.`
        : `No ${scope}companies found.`,
      matches: [],
      bullets: ranked.slice(0, 6).map(([name, n], i) => `${i + 1}. ${countryFlag(name)} ${name} — ${n}`),
      actions: top
        ? [{ label: `View Companies in ${top[0]}`, kind: "view", primary: true, directive: { target: "company-discovery", country: top[0], industryKeywords: keywords, sort: "score-desc" } }, ...exportAction(pool)]
        : [],
    };
  }

  // 2) Aggregation — "top industries in X"
  if (/top industr|industr(y|ies) (in|breakdown|distribution|mix)|what industr|industr(y|ies)\b.*\bin\b/.test(q)) {
    const pool = country ? companies.filter((c) => normalizeCountry(c.country) === country) : companies;
    const ranked = groupCount(pool, (c) => c.industry || "Unknown");
    const where = country ? ` in ${country}` : "";
    return {
      answer: ranked.length
        ? `Top industries${where}: ${ranked.slice(0, 3).map(([n]) => n).join(", ")}.`
        : `No industry data${where}.`,
      matches: [],
      bullets: ranked.slice(0, 6).map(([name, n], i) => `${i + 1}. ${name} — ${n}`),
      actions: country
        ? [{ label: `View Companies in ${country}`, kind: "view", primary: true, directive: { target: "company-discovery", country, sort: "score-desc" } }, ...exportAction(pool)]
        : exportAction(pool),
    };
  }

  // 3) Missing data — "companies with missing linkedin / no website / no email"
  const missingMatch = /missing|without|no\b|lacking|don'?t have/.test(q);
  if (missingMatch && /(linkedin|website|web site|email|phone)/.test(q)) {
    let pred: (c: Company) => boolean = () => false;
    let field = "data";
    if (/linkedin/.test(q)) { pred = (c) => !hasLinkedin(c); field = "LinkedIn profiles"; }
    else if (/website|web site/.test(q)) { pred = (c) => !(c.website || "").trim(); field = "websites"; }
    else if (/email/.test(q)) { pred = (c) => !hasEmail(c); field = "email addresses"; }
    else if (/phone/.test(q)) { pred = (c) => !hasPhone(c); field = "phone numbers"; }
    let set = companies.filter(pred);
    if (country) set = set.filter((c) => normalizeCountry(c.country) === country);
    set = [...set].sort(byScore);
    const where = country ? ` in ${country}` : "";
    return {
      answer: `${set.length} ${set.length === 1 ? "company is" : "companies are"} missing ${field}${where}.`,
      matches: set,
      note: "Shown inside the assistant — Company Discovery filters by present data, not missing.",
      actions: exportAction(set),
    };
  }

  // 3b) Employee-size threshold — "companies above 1000 employees"
  const minEmployees = detectMinEmployees(q);
  if (minEmployees && !/outreach|draft|message|sequence/.test(q)) {
    let set = companies.filter((c) => normalizedEmployees(c) >= minEmployees);
    if (country) set = set.filter((c) => normalizeCountry(c.country) === country);
    if (keywords.length) set = set.filter((c) => industryMatches(c, keywords));
    set = [...set].sort((a, b) => normalizedEmployees(b) - normalizedEmployees(a));
    return {
      answer: `${set.length} ${set.length === 1 ? "company has" : "companies have"} ${minEmployees.toLocaleString()}+ employees${country ? ` in ${country}` : ""}${labels.length ? ` (${labels.join(" / ")})` : ""}.`,
      matches: set,
      actions: set.length
        ? [
            { label: "View Companies", kind: "view", primary: true, directive: { target: "company-discovery", country, industryKeywords: keywords, sort: "size-desc" } },
            ...exportAction(set),
          ]
        : [],
    };
  }

  // 4) Outreach — "generate outreach for top leads" / "for <company>"
  if (/outreach|draft|message|sequence|cold email|reach out/.test(q)) {
    // Named company takes priority ("generate outreach for Falcon AI").
    const named = detectCompany(q, companies);
    if (named) {
      return {
        answer: `Preloaded ${named.name} into Outreach Studio — ready to generate.`,
        matches: [named],
        actions: [
          { label: "Generate Outreach", kind: "outreach", primary: true, directive: { target: "outreach-studio", companyIds: [named.id] } },
          { label: "View Insights", kind: "view", directive: { target: "company-discovery", search: named.name } },
        ],
      };
    }
    let pool = companies;
    if (country) pool = pool.filter((c) => normalizeCountry(c.country) === country);
    if (keywords.length) pool = pool.filter((c) => industryMatches(c, keywords));
    const top = [...pool].sort(byScore).slice(0, TOP_N);
    return {
      answer: top.length
        ? `Preloaded the top ${top.length} ${listLabel(country, labels)} into Outreach Studio.`
        : `No ${listLabel(country, labels)} found to draft outreach for.`,
      matches: top,
      actions: top.length
        ? [
            { label: "Generate Outreach", kind: "outreach", primary: true, directive: { target: "outreach-studio", companyIds: top.map((c) => c.id) } },
            { label: "View Companies", kind: "view", directive: { target: "company-discovery", country, industryKeywords: keywords, sort: "score-desc" } },
            ...exportAction(top),
          ]
        : [],
    };
  }

  // 5) High-intent / hot accounts — "show highest intent accounts"
  if (/intent|hot lead|hottest|high.?intent|highest scoring|best leads|hot account/.test(q)) {
    const minScore = 80;
    let set = companies.filter((c) => c.leadScore >= minScore);
    if (country) set = set.filter((c) => normalizeCountry(c.country) === country);
    set = [...set].sort(byScore);
    return {
      answer: `${set.length} high-intent (Hot) ${set.length === 1 ? "account" : "accounts"} with a lead score ≥ ${minScore}${country ? ` in ${country}` : ""}.`,
      matches: set,
      actions: [
        { label: "Open Lead Scoring", kind: "score", primary: true, directive: { target: "ai-lead-scoring", band: "Hot", minScore } },
        { label: "Generate Outreach", kind: "outreach", directive: { target: "outreach-studio", companyIds: set.slice(0, TOP_N).map((c) => c.id) } },
        ...exportAction(set),
      ],
    };
  }

  // 6) Top opportunities / top leads / CTO opportunities — sort by score
  if (/\btop\b|highest|best (companies|accounts|opportunit)|prioritiz|opportunit/.test(q)) {
    let pool = companies;
    if (country) pool = pool.filter((c) => normalizeCountry(c.country) === country);
    if (keywords.length) pool = pool.filter((c) => industryMatches(c, keywords));
    const ranked = [...pool].sort(byScore);
    return {
      answer: ranked.length
        ? `Top ${Math.min(TOP_N, ranked.length)} highest-scoring ${listLabel(country, labels)}, ranked by lead score.`
        : `No ${listLabel(country, labels)} found.`,
      matches: ranked,
      actions: ranked.length
        ? [
            { label: "View Companies", kind: "view", primary: true, directive: { target: "company-discovery", country, industryKeywords: keywords, sort: "score-desc" } },
            { label: "Generate Outreach", kind: "outreach", directive: { target: "outreach-studio", companyIds: ranked.slice(0, TOP_N).map((c) => c.id) } },
            ...exportAction(ranked),
          ]
        : [],
    };
  }

  // 7) Default — find / list companies by country + industry
  {
    let pool = companies;
    if (country) pool = pool.filter((c) => normalizeCountry(c.country) === country);
    if (keywords.length) pool = pool.filter((c) => industryMatches(c, keywords));

    // If nothing structured was detected, fall back to a free-text search.
    if (!country && !keywords.length) {
      const tokens = q.split(/\s+/).filter((t) => t.length > 2 && !/^(the|and|for|with|show|find|list|companies|company|firms|give|me|all|in|of|a)$/.test(t));
      if (tokens.length) {
        pool = companies.filter((c) =>
          tokens.some((t) => [c.name, c.industry, c.city, c.country, c.description].some((v) => (v || "").toLowerCase().includes(t))),
        );
      }
    }

    const ranked = [...pool].sort(byScore);
    return {
      answer: ranked.length
        ? `Found ${ranked.length} ${listLabel(country, labels)}.`
        : `No ${listLabel(country, labels)} matched. Try another market or sector.`,
      matches: ranked,
      actions: ranked.length
        ? [
            { label: "View Companies", kind: "view", primary: true, directive: { target: "company-discovery", country, industryKeywords: keywords, search: country || keywords.length ? undefined : rawQuery.trim(), sort: "score-desc" } },
            { label: "Generate Outreach", kind: "outreach", directive: { target: "outreach-studio", companyIds: ranked.slice(0, TOP_N).map((c) => c.id) } },
            ...exportAction(ranked),
          ]
        : [],
    };
  }
}

/** Build a CSV string from matched records for the "Export Results" action. */
export function matchesToCsv(matches: Company[]): string {
  const headers = ["Name", "Country", "City", "Industry", "Lead Score", "Website", "LinkedIn", "Email", "Phone"];
  const esc = (v: unknown) => {
    const s = String(v ?? "").replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const rows = matches.map((c) =>
    [c.name, normalizeCountry(c.country), c.city, c.industry, c.leadScore, c.website, c.linkedin, c.generalEmail, c.generalPhone]
      .map(esc)
      .join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}
