-- Phase 2 (epic &1): Company Intelligence / Discovery columns.
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "iso_code" text;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "employee_count" integer;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "ai_readiness_score" real;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "data_science_score" real;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "data_engineering_score" real;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "power_bi_score" real;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "cloud_score" real;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "automation_score" real;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "opportunity_score" real;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "intelligence_source" text;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "intelligence_generated_at" timestamp;

CREATE INDEX IF NOT EXISTS "companies_opportunity_idx" ON "companies" ("opportunity_score");
