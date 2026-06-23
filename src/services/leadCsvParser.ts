// Provider-agnostic CSV lead parser.
// Auto-detects Apollo, LinkedIn, Sales Navigator, and Generic CSV exports.
// Normalizes every row into a ParsedLead shape that maps to Company + DecisionMaker.

export type CsvProvider = "apollo" | "linkedin" | "salesnavigator" | "generic";

export interface ParsedLead {
  // Company fields
  companyName: string;
  companyWebsite: string;
  companyLinkedin: string;
  companyIndustry: string;
  companyEmployees: number;
  companyCountry: string;
  companyCountryCode: string;

  // Person fields
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  email: string;
  linkedin: string;
  seniority: string;

  // Phase 8 — extended company + decision-maker fields
  companyCity?: string;
  companyDescription?: string;
  companyGeneralEmail?: string;
  companyPhone?: string;
  decisionMakerType?: string;

  // Meta
  rowIndex: number;
}

export interface ParseResult {
  provider: CsvProvider;
  leads: ParsedLead[];
  headers: string[];
  parseErrors: Array<{ row: number; message: string }>;
  skippedRows: number;
}

// ─── CSV tokenizer ─────────────────────────────────────────────────────────────

function parseCsvText(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // strip BOM
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') { field += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      row.push(field.trim()); field = "";
    } else if ((ch === "\n" || (ch === "\r" && next === "\n")) && !inQuotes) {
      if (ch === "\r") i++;
      row.push(field.trim());
      if (row.some((c) => c !== "")) rows.push(row);
      row = []; field = "";
    } else if (ch === "\r" && !inQuotes) {
      // skip lone CR
    } else {
      field += ch;
    }
  }

  if (field || row.length > 0) {
    row.push(field.trim());
    if (row.some((c) => c !== "")) rows.push(row);
  }

  return rows;
}

// ─── Provider detection ────────────────────────────────────────────────────────

function detectProvider(headers: string[]): CsvProvider {
  const h = new Set(headers.map((x) => x.toLowerCase().trim()));
  if (h.has("email status") || h.has("seniority") || h.has("company name for emails")) return "apollo";
  if (h.has("connected on") || h.has("email address")) return "linkedin";
  if (h.has("linkedin profile url") || h.has("account name") || h.has("company domain")) return "salesnavigator";
  return "generic";
}

// ─── Header lookup helpers ─────────────────────────────────────────────────────

function getCell(row: string[], headers: string[], ...candidates: string[]): string {
  const hLower = headers.map((x) => x.toLowerCase().trim());
  for (const c of candidates) {
    const i = hLower.indexOf(c.toLowerCase());
    if (i !== -1) return (row[i] ?? "").trim();
  }
  return "";
}

// ─── Country code lookup ───────────────────────────────────────────────────────

const COUNTRY_CODES: Record<string, string> = {
  "united kingdom": "GB", uk: "GB", england: "GB", britain: "GB",
  "united states": "US", usa: "US", us: "US", america: "US",
  germany: "DE", singapore: "SG", australia: "AU", japan: "JP",
  canada: "CA", france: "FR", netherlands: "NL", switzerland: "CH",
  norway: "NO", luxembourg: "LU", "united arab emirates": "AE", uae: "AE",
  "saudi arabia": "SA", qatar: "QA", kuwait: "KW", bahrain: "BH",
  oman: "OM", india: "IN", china: "CN", brazil: "BR",
};

function toCountryCode(country: string): string {
  return COUNTRY_CODES[country.toLowerCase().trim()] ?? "";
}

// ─── Row mappers ───────────────────────────────────────────────────────────────

function mapApolloRow(row: string[], headers: string[], rowIndex: number): ParsedLead {
  const firstName = getCell(row, headers, "first name");
  const lastName = getCell(row, headers, "last name");
  const country = getCell(row, headers, "company country", "country");
  const empRaw = getCell(row, headers, "employees", "# employees", "company headcount");
  const employees = parseInt(empRaw.replace(/[^0-9]/g, ""), 10);
  return {
    companyName: getCell(row, headers, "company", "company name for emails", "account name"),
    companyWebsite: getCell(row, headers, "website", "company website"),
    companyLinkedin: getCell(row, headers, "company linkedin url", "company linkedin"),
    companyIndustry: getCell(row, headers, "industry"),
    companyEmployees: isNaN(employees) ? 0 : employees,
    companyCountry: country,
    companyCountryCode: toCountryCode(country),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    role: getCell(row, headers, "title", "job title"),
    email: getCell(row, headers, "email"),
    linkedin: getCell(row, headers, "linkedin url", "person linkedin url"),
    seniority: getCell(row, headers, "seniority"),
    rowIndex,
  };
}

function mapLinkedInRow(row: string[], headers: string[], rowIndex: number): ParsedLead {
  const firstName = getCell(row, headers, "first name");
  const lastName = getCell(row, headers, "last name");
  const country = getCell(row, headers, "country", "location");
  return {
    companyName: getCell(row, headers, "company", "employer", "organization"),
    companyWebsite: "",
    companyLinkedin: "",
    companyIndustry: getCell(row, headers, "industry"),
    companyEmployees: 0,
    companyCountry: country,
    companyCountryCode: toCountryCode(country),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    role: getCell(row, headers, "position", "title", "job title"),
    email: getCell(row, headers, "email address", "email"),
    linkedin: getCell(row, headers, "profile url", "linkedin url"),
    seniority: "",
    rowIndex,
  };
}

function mapSalesNavRow(row: string[], headers: string[], rowIndex: number): ParsedLead {
  const firstName = getCell(row, headers, "first name");
  const lastName = getCell(row, headers, "last name");
  const country = getCell(row, headers, "company country", "geography", "country");
  const empRaw = getCell(row, headers, "employees", "headcount", "company employee count");
  const employees = parseInt(empRaw.replace(/[^0-9]/g, ""), 10);
  return {
    companyName: getCell(row, headers, "company", "account name", "account"),
    companyWebsite: getCell(row, headers, "company website", "company domain", "website"),
    companyLinkedin: getCell(row, headers, "company linkedin url"),
    companyIndustry: getCell(row, headers, "industry", "company industry"),
    companyEmployees: isNaN(employees) ? 0 : employees,
    companyCountry: country,
    companyCountryCode: toCountryCode(country),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    role: getCell(row, headers, "title", "job title"),
    email: getCell(row, headers, "email", "email address"),
    linkedin: getCell(row, headers, "linkedin profile url", "linkedin url", "profile url"),
    seniority: getCell(row, headers, "seniority"),
    rowIndex,
  };
}

function mapGenericRow(row: string[], headers: string[], rowIndex: number): ParsedLead {
  const firstName = getCell(row, headers, "first name", "first_name", "firstname");
  const lastName  = getCell(row, headers, "last name", "last_name", "lastname", "surname");
  // decision_maker_name (Decision Makers CSV) takes precedence for the person name.
  const fullName  = getCell(row, headers, "decision_maker_name", "decision maker name", "name", "full name", "contact name") || `${firstName} ${lastName}`.trim();
  const country   = getCell(row, headers, "company country", "country", "location", "region");
  const empRaw    = getCell(row, headers, "employee_size", "employee size", "employees", "headcount", "team size", "company size", "employee count");
  // employee_size is often a range ("1000-5000", "10,000+"). Take the first
  // number (lower bound) — NOT all digits concatenated, which inflates counts.
  const empMatch  = empRaw.replace(/,/g, "").match(/\d+/);
  const employees = empMatch ? parseInt(empMatch[0], 10) : 0;
  return {
    companyCity: getCell(row, headers, "city", "company city", "town"),
    companyDescription: getCell(row, headers, "company_description", "company description", "description", "about"),
    companyGeneralEmail: getCell(row, headers, "general_contact_email", "general contact email", "company email", "company_email", "contact email"),
    companyPhone: getCell(row, headers, "general_phone_number", "general phone number", "phone", "company phone", "company_phone", "telephone"),
    decisionMakerType: getCell(row, headers, "decision_maker_type", "decision maker type", "type", "persona", "role type"),
    companyName: getCell(row, headers, "company_name", "company name", "company", "organization", "employer", "account", "account name"),
    companyWebsite: getCell(row, headers, "website", "company website", "domain", "url", "company url"),
    companyLinkedin: getCell(row, headers, "linkedin_company_url", "linkedin company url", "company linkedin", "company linkedin url", "company linkedin page", "linkedin"),
    companyIndustry: getCell(row, headers, "industry", "company industry", "sector", "vertical"),
    companyEmployees: isNaN(employees) ? 0 : employees,
    companyCountry: country,
    companyCountryCode: toCountryCode(country),
    firstName: firstName || fullName.split(" ")[0] || "",
    lastName: lastName || fullName.split(" ").slice(1).join(" ") || "",
    fullName,
    role: getCell(row, headers, "decision_maker_title", "decision maker title", "title", "role", "position", "job title", "job_title"),
    email: getCell(row, headers, "email", "contact email", "email address", "work email"),
    // Prefer a contact/person-specific LinkedIn before any bare "linkedin" column
    // (which the generic format usually reserves for the company page).
    linkedin: getCell(row, headers, "decision_maker_linkedin_url", "decision maker linkedin url", "contact linkedin", "contact linkedin url", "person linkedin url", "person linkedin", "linkedin url", "linkedin profile", "profile url"),
    seniority: getCell(row, headers, "seniority", "level", "seniority level"),
    rowIndex,
  };
}

// ─── Main export ───────────────────────────────────────────────────────────────

export function parseCsv(csvText: string): ParseResult {
  const rawRows = parseCsvText(csvText);
  if (rawRows.length < 2) {
    return {
      provider: "generic",
      leads: [],
      headers: rawRows[0] ?? [],
      parseErrors: [{ row: 0, message: "CSV has no data rows" }],
      skippedRows: 0,
    };
  }

  const headers = rawRows[0];
  const provider = detectProvider(headers);
  const leads: ParsedLead[] = [];
  const parseErrors: Array<{ row: number; message: string }> = [];
  let skippedRows = 0;

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    // Pad short rows to header length
    while (row.length < headers.length) row.push("");

    try {
      let lead: ParsedLead;
      if (provider === "apollo")          lead = mapApolloRow(row, headers, i);
      else if (provider === "linkedin")   lead = mapLinkedInRow(row, headers, i);
      else if (provider === "salesnavigator") lead = mapSalesNavRow(row, headers, i);
      else                                lead = mapGenericRow(row, headers, i);

      if (!lead.companyName && !lead.fullName && !lead.email) {
        skippedRows++;
        continue;
      }
      leads.push(lead);
    } catch (err: unknown) {
      parseErrors.push({ row: i + 1, message: (err as Error)?.message ?? "Unknown parse error" });
      skippedRows++;
    }
  }

  return { provider, leads, headers, parseErrors, skippedRows };
}
