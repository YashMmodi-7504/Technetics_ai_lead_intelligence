// Zod schemas + inferred types for every structured AI response.
import { z } from "zod";

export const leadScoreSchema = z.object({
  recommendations: z.array(z.string()).min(1).max(5),
});
export type LeadScoreResult = z.infer<typeof leadScoreSchema>;

export const countryAnalysisSchema = z.object({
  summary: z.string(),
  gdpOutlook: z.string(),
  englishProficiency: z.string(),
  topIndustries: z.array(z.string()),
  opportunityScore: z.number().min(0).max(100),
});
export type CountryAnalysisResult = z.infer<typeof countryAnalysisSchema>;

export const companyAnalysisSchema = z.object({
  summary: z.string(),
  likelyTechStack: z.array(z.string()),
  hiringNeeds: z.array(z.string()),
});
export type CompanyAnalysisResult = z.infer<typeof companyAnalysisSchema>;

// Country demand across the 8 TECHNETICS skill dimensions (each 0-100).
export const demandDimensionsSchema = z.object({
  ai: z.number().min(0).max(100),
  generativeAi: z.number().min(0).max(100),
  machineLearning: z.number().min(0).max(100),
  dataScience: z.number().min(0).max(100),
  dataEngineering: z.number().min(0).max(100),
  powerBI: z.number().min(0).max(100),
  cloud: z.number().min(0).max(100),
  automation: z.number().min(0).max(100),
});
export type DemandDimensions = z.infer<typeof demandDimensionsSchema>;

export const countryDemandSchema = z.object({
  demand: demandDimensionsSchema,
  topIndustries: z.array(z.string()),
  summary: z.string(),
});
export type CountryDemandResult = z.infer<typeof countryDemandSchema>;

