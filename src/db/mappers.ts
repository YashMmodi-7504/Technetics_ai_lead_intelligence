// Maps DB rows (jsonb profile + flat columns) to frontend-shaped objects and
// back. The jsonb `profile` column is the source of truth for the rich shape;
// flat columns mirror frequently-queried/filtered fields.
import type {
  Company,
  CountryOpportunity,
  DecisionMaker,
  LeadStatus,
} from "../types.js";

type CompanyRow = {
  slug: string;
  status: string | null;
  leadScore: number | null;
  aiScore: number | null;
  profile: unknown;
};

type CountryRow = {
  slug: string;
  opportunityScore: number | null;
  profile: unknown;
};

type DecisionMakerRow = {
  slug: string;
  profile: unknown;
};

export function rowToCompany(row: CompanyRow): Company {
  const profile = row.profile as Company;
  return {
    ...profile,
    id: row.slug,
    status: (row.status as LeadStatus) ?? profile.status,
    leadScore: row.leadScore ?? profile.leadScore,
    aiScore: row.aiScore ?? profile.aiScore,
  };
}

export function companyToRow(company: Company) {
  return {
    slug: company.id,
    name: company.name,
    domain: company.website,
    industry: company.industry,
    countrySlug: company.countryCode,
    status: company.status,
    leadScore: company.leadScore,
    aiScore: company.aiScore,
    profile: company,
  };
}

export function rowToCountry(row: CountryRow): CountryOpportunity {
  const profile = row.profile as CountryOpportunity;
  return {
    ...profile,
    id: row.slug,
    opportunityScore: row.opportunityScore ?? profile.opportunityScore,
  };
}

export function countryToRow(country: CountryOpportunity) {
  return {
    slug: country.id,
    name: country.country,
    opportunityScore: country.opportunityScore,
    profile: country,
  };
}

export function rowToDecisionMaker(row: DecisionMakerRow): DecisionMaker {
  const profile = row.profile as DecisionMaker;
  return { ...profile, id: row.slug };
}

export function decisionMakerToRow(dm: DecisionMaker) {
  return {
    slug: dm.id,
    companySlug: dm.companyId,
    name: dm.name,
    role: dm.role,
    email: dm.email,
    priorityScore: dm.priorityScore,
    profile: dm,
  };
}
