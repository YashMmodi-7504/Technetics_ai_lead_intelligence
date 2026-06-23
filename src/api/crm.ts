// Typed CRM API functions consumed by the React data layer.
import { apiFetch } from "./client";
import type { Company, CountryOpportunity, DecisionMaker } from "../types";

interface PaginatedResponse<T> {
  data: T[];
  pagination: { limit: number; offset: number; total: number };
}

// Load EVERY record by following pagination. The backend caps `limit` at 100,
// so we page through `total` (advancing by the actual rows returned) instead of
// silently loading only the first page (the default limit of 50).
async function fetchAll<T>(path: string): Promise<T[]> {
  const PAGE = 100;
  const out: T[] = [];
  let offset = 0;
  // safety bound: 100 pages = 10,000 records
  for (let i = 0; i < 100; i++) {
    const res = await apiFetch<PaginatedResponse<T> | T[]>(`${path}?limit=${PAGE}&offset=${offset}`);
    if (Array.isArray(res)) return res; // non-paginated endpoint shape
    out.push(...res.data);
    const total = res.pagination?.total ?? out.length;
    if (res.data.length === 0 || out.length >= total) break;
    offset += res.data.length;
  }
  return out;
}

export function fetchCompanies(): Promise<Company[]> {
  return fetchAll<Company>("/crm/companies");
}

export function fetchCountries(): Promise<CountryOpportunity[]> {
  return fetchAll<CountryOpportunity>("/crm/countries");
}

export function fetchDecisionMakers(): Promise<DecisionMaker[]> {
  return fetchAll<DecisionMaker>("/crm/decision-makers");
}

export function updateLeadStatus(
  companyId: string,
  status: Company["status"],
  user?: string,
): Promise<Company> {
  return apiFetch<Company>(`/crm/companies/${companyId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, user }),
  });
}

export function addCompanyNote(
  companyId: string,
  author: string,
  content: string,
): Promise<Company> {
  return apiFetch<Company>(`/crm/companies/${companyId}/notes`, {
    method: "POST",
    body: JSON.stringify({ author, content }),
  });
}

export function updateCompanyScores(
  companyId: string,
  scores: {
    dataScienceScore: number;
    powerBIScore: number;
    cloudScore: number;
    automationScore: number;
    buyingIntentScore: number;
    leadScore: number;
  },
): Promise<Company> {
  return apiFetch<Company>(`/crm/companies/${companyId}/scores`, {
    method: "PUT",
    body: JSON.stringify(scores),
  });
}

export function ingestCompany(linkedinUrl: string): Promise<Company> {
  return apiFetch<Company>("/crm/companies/ingest", {
    method: "POST",
    body: JSON.stringify({ linkedinUrl }),
  });
}
