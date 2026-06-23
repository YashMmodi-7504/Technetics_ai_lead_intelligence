-- Phase 1 (epic &1): Country Intelligence demand columns.
ALTER TABLE "countries" ADD COLUMN IF NOT EXISTS "iso_code" text;
ALTER TABLE "countries" ADD COLUMN IF NOT EXISTS "demand_scores" jsonb;
ALTER TABLE "countries" ADD COLUMN IF NOT EXISTS "skill_rankings" jsonb;
ALTER TABLE "countries" ADD COLUMN IF NOT EXISTS "recommended_services" jsonb;
ALTER TABLE "countries" ADD COLUMN IF NOT EXISTS "demand_overall" real;
ALTER TABLE "countries" ADD COLUMN IF NOT EXISTS "intelligence_source" text;
ALTER TABLE "countries" ADD COLUMN IF NOT EXISTS "intelligence_generated_at" timestamp;
