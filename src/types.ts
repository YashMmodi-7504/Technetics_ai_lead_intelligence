// src/types.ts

export interface CustomLatLng {
  lat: number;
  lng: number;
}

export interface CountryOpportunity {
  id: string;
  country: string;
  code: string;
  opportunityScore: number;
  gdp: string;
  techAdoption: number; // 0-100
  aiAdoption: number; // 0-100
  outsourcingOpportunity: number; // 0-100
  topIndustries: string[];
  topConsultingFirms: string[];
  recommendedServices: string[];
  description: string;
  capital: string;
  language: string;
  itMarketSize: string;
  avgHourlyRate: string;
  coordinates: CustomLatLng;
}

export type LeadStatus =
  | "New Leads"
  | "Qualified"
  | "Contacted"
  | "Meeting Scheduled"
  | "Proposal Sent"
  | "Negotiation"
  | "Won"
  | "Lost";

export interface ActivityLog {
  id: string;
  date: string;
  type: "email" | "call" | "linkedin" | "system" | "meeting" | "proposal";
  title: string;
  description: string;
  user: string;
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  country: string;
  countryCode: string;
  industry: string;
  employees: number;
  website: string;
  linkedin: string;
  aiScore: number; // 0-100
  leadScore: number; // 0-100
  status: LeadStatus;

  // High Fidelity Profiles
  description: string;
  techStack: string[];
  services: string[];
  locations: string[];
  hiringActivity: "High" | "Medium" | "Low" | "N/A";
  hiringDetails?: string;

  // Specific Scoring Matrix
  dataScienceScore: number; // 0-100
  powerBIScore: number; // 0-100
  cloudScore: number; // 0-100
  automationScore: number; // 0-100
  buyingIntentScore: number; // 0-100

  recommendedService: string;
  opportunityAnalysis: string;

  // Phase 8 — fields sourced directly from the Companies CSV
  city?: string;
  generalEmail?: string;
  generalPhone?: string;

  // CRM Extra details
  notes: Array<{ id: string; date: string; author: string; content: string }>;
  activityTimeline: ActivityLog[];
}

export interface DecisionMaker {
  id: string;
  name: string;
  role:
    | "Founder"
    | "CEO"
    | "CTO"
    | "CIO"
    | "Head of AI"
    | "Head of Data"
    | "Innovation Director"
    | "Digital Transformation Director"
    | string;
  companyId: string;
  companyName: string;
  avatar: string;
  linkedin: string;
  priorityScore: number; // 0-100
  contactStatus: "New" | "Contacted" | "Nurturing" | "Replied" | "Meeting Set";
  email: string;
  phone?: string;

  // Phase 8 — fields sourced directly from the Decision Makers CSV
  title?: string; // raw decision_maker_title
  decisionMakerType?: string; // decision_maker_type (CEO, Founder, CTO, …)
}

export interface OutreachTemplate {
  id: string;
  channel:
    | "linkedin"
    | "email"
    | "followup1"
    | "followup2"
    | "followup3"
    | "proposal";
  label: string;
  subject?: string;
  content: string;
}

export interface PerformanceStats {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  activeOpportunities: number;
  totalCountries: number;
  totalCompanies: number;
  totalDecisionMakers: number;
  messagesGenerated: number;
  meetingsScheduled: number;
}

export interface PromptHistoryEntry {
  id: string;
  timestamp: string;
  prompt: string;
  responseType: string;
}

export interface OpportunityPrioritization {
  countryScore: number;
  marketGrowthScore: number;
  industryFitScore: number;
  companySizeScore: number;
  revenuePotentialScore: number;
  decisionMakerQualityScore: number;
  engagementScore: number;
  intentScore: number;
  finalScore: number;
  confidence: number;
  priority: "Critical" | "High" | "Medium" | "Low" | "Ignore";
  reasoning: { text: string; impact: number }[];
  recommendedAction: string;
}
