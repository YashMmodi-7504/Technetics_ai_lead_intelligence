-- Migration for Task #5: jsonb profile columns + decision_makers table.
-- Reproduces the schema in src/db/schema.ts deterministically.
-- For a fresh database, `drizzle-kit push` is equivalent; this file documents
-- the canonical DDL for review/CI.

ALTER TABLE "countries" ADD COLUMN IF NOT EXISTS "slug" text;
ALTER TABLE "countries" ADD COLUMN IF NOT EXISTS "profile" jsonb;
ALTER TABLE "countries" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();
UPDATE "countries" SET "profile" = '{}'::jsonb WHERE "profile" IS NULL;
ALTER TABLE "countries" ALTER COLUMN "profile" SET NOT NULL;
DO $$ BEGIN
  ALTER TABLE "countries" ADD CONSTRAINT "countries_slug_unique" UNIQUE ("slug");
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "companies" DROP COLUMN IF EXISTS "country_id";
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "slug" text;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "country_slug" text;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'New Leads';
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "lead_score" real;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "ai_score" real;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "profile" jsonb;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();
UPDATE "companies" SET "profile" = '{}'::jsonb WHERE "profile" IS NULL;
ALTER TABLE "companies" ALTER COLUMN "profile" SET NOT NULL;
DO $$ BEGIN
  ALTER TABLE "companies" ADD CONSTRAINT "companies_slug_unique" UNIQUE ("slug");
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "decision_makers" (
  "id" serial PRIMARY KEY,
  "slug" text NOT NULL UNIQUE,
  "company_slug" text,
  "name" text NOT NULL,
  "role" text,
  "email" text,
  "priority_score" real,
  "profile" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "companies_country_slug_idx" ON "companies" ("country_slug");
CREATE INDEX IF NOT EXISTS "decision_makers_company_slug_idx" ON "decision_makers" ("company_slug");
CREATE INDEX IF NOT EXISTS "companies_status_idx" ON "companies" ("status");
