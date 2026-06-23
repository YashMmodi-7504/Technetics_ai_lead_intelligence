// Job-title normalization for multi-source lead acquisition (Phase 8A).
// Maps messy free-text titles ("VP, Eng.", "Chief Tech Officer") onto a
// canonical role + seniority tier + department. Pure + deterministic so it can
// be unit-tested and reused by the import pipeline and AI scoring.

export type SeniorityTier =
  | "Founder"
  | "C-Suite"
  | "VP"
  | "Head"
  | "Director"
  | "Manager"
  | "Senior"
  | "Entry"
  | "Unknown";

export type Department =
  | "Executive"
  | "Technology"
  | "Data & AI"
  | "Product"
  | "Sales"
  | "Marketing"
  | "Finance"
  | "Operations"
  | "People"
  | "Other";

export interface NormalizedTitle {
  /** Original, trimmed. */
  raw: string;
  /** Canonical display title (e.g. "CTO", "Head of Data"). */
  canonical: string;
  seniority: SeniorityTier;
  department: Department;
  /** Whether a confident canonical match was found (vs. fallback title-case). */
  matched: boolean;
}

const PRIORITY_BY_TIER: Record<SeniorityTier, number> = {
  Founder: 96,
  "C-Suite": 95,
  VP: 88,
  Head: 85,
  Director: 80,
  Manager: 72,
  Senior: 68,
  Entry: 55,
  Unknown: 60,
};

export function priorityForSeniority(tier: SeniorityTier): number {
  return PRIORITY_BY_TIER[tier];
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function detectDepartment(t: string): Department {
  if (/(data scien|analytics|machine learning|\bml\b|\ba\.?i\.?\b|artificial intelligence|data engineer)/.test(t))
    return "Data & AI";
  if (/(engineer|developer|technolog|software|\bit\b|information|devops|architect|security|infrastructure|technical)/.test(t))
    return "Technology";
  if (/(product manager|product owner|head of product|chief product|vp product)/.test(t)) return "Product";
  if (/(sales|revenue|account executive|business development|\bbdr\b|\bsdr\b)/.test(t)) return "Sales";
  if (/(marketing|growth|demand gen|brand|content)/.test(t)) return "Marketing";
  if (/(finance|accounting|controller|\bcfo\b|treasur)/.test(t)) return "Finance";
  if (/(people|talent|human resources|\bhr\b|recruit)/.test(t)) return "People";
  if (/(operations|\bops\b|\bcoo\b|supply chain|logistics)/.test(t)) return "Operations";
  if (/(ceo|chief executive|founder|owner|president|managing director|\bmd\b)/.test(t)) return "Executive";
  return "Other";
}

function detectSeniority(t: string): SeniorityTier {
  if (/(founder|co[\s-]?founder|owner)/.test(t)) return "Founder";
  if (/(chief|\bc[teiomdf]o\b|\bcaio\b|\bciso\b|\bcpo\b)/.test(t) || /chief .* officer/.test(t)) return "C-Suite";
  if (/(vp|v\.p\.|vice president|svp|evp)/.test(t)) return "VP";
  if (/head of|head,|global head|^head\b/.test(t)) return "Head";
  if (/director/.test(t)) return "Director";
  if (/manager|mgr\b/.test(t)) return "Manager";
  if (/senior|sr\.?\b|lead\b|principal|staff/.test(t)) return "Senior";
  if (/intern|junior|jr\.?\b|associate|assistant|entry|trainee|coordinator/.test(t)) return "Entry";
  return "Unknown";
}

// Canonical exact mappings checked first (key = normalized lowercase contains).
const CANONICAL_RULES: { test: RegExp; canonical: string }[] = [
  { test: /chief executive officer|^ceo\b|\bceo$/, canonical: "CEO" },
  { test: /chief technology officer|^cto\b|\bcto$|chief technical officer/, canonical: "CTO" },
  { test: /chief information officer|^cio\b|\bcio$/, canonical: "CIO" },
  { test: /chief financial officer|^cfo\b|\bcfo$/, canonical: "CFO" },
  { test: /chief operating officer|^coo\b|\bcoo$/, canonical: "COO" },
  { test: /chief marketing officer|^cmo\b|\bcmo$/, canonical: "CMO" },
  { test: /chief data officer|^cdo\b|\bcdo$/, canonical: "Chief Data Officer" },
  { test: /chief ai officer|chief artificial intelligence|^caio\b/, canonical: "Chief AI Officer" },
  { test: /chief product officer|^cpo\b/, canonical: "Chief Product Officer" },
  { test: /chief information security|^ciso\b/, canonical: "CISO" },
  { test: /co[\s-]?founder/, canonical: "Co-Founder" },
  { test: /founder/, canonical: "Founder" },
  { test: /head of (data science|data)/, canonical: "Head of Data" },
  { test: /head of (ai|machine learning|artificial intelligence)/, canonical: "Head of AI" },
  { test: /head of (engineering|technology)/, canonical: "Head of Engineering" },
  { test: /head of product/, canonical: "Head of Product" },
  { test: /(vp|vice president).*(engineering|technology)/, canonical: "VP Engineering" },
  { test: /(vp|vice president).*(data|analytics)/, canonical: "VP Data" },
  { test: /(vp|vice president).*(product)/, canonical: "VP Product" },
  { test: /(vp|vice president).*(sales|revenue)/, canonical: "VP Sales" },
  { test: /director.*(data|analytics)/, canonical: "Director of Data" },
  { test: /director.*(engineering|technology)/, canonical: "Director of Engineering" },
  { test: /(digital transformation|transformation director)/, canonical: "Digital Transformation Director" },
  { test: /(innovation director|director.*innovation)/, canonical: "Innovation Director" },
  { test: /managing director|^md$/, canonical: "Managing Director" },
  { test: /president/, canonical: "President" },
];

/** Normalize a raw job title into canonical role + seniority + department. */
export function normalizeTitle(raw: string): NormalizedTitle {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return { raw: "", canonical: "Contact", seniority: "Unknown", department: "Other", matched: false };
  }

  const t = trimmed.toLowerCase();
  const seniority = detectSeniority(t);
  const department = detectDepartment(t);

  for (const rule of CANONICAL_RULES) {
    if (rule.test.test(t)) {
      return { raw: trimmed, canonical: rule.canonical, seniority, department, matched: true };
    }
  }

  // Fallback: clean punctuation, title-case the original.
  const cleaned = trimmed.replace(/\s+/g, " ").replace(/[.,;]+$/g, "");
  return {
    raw: trimmed,
    canonical: titleCase(cleaned),
    seniority,
    department,
    matched: false,
  };
}
