import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  real,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  // Stable string key matching the frontend id (e.g. "c1")
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  isoCode: text("iso_code"),
  opportunityScore: real("opportunity_score"),
  // Phase 1 (epic &1) intelligence outputs.
  demandScores: jsonb("demand_scores"),
  skillRankings: jsonb("skill_rankings"),
  recommendedServices: jsonb("recommended_services"),
  demandOverall: real("demand_overall"),
  intelligenceSource: text("intelligence_source"),
  intelligenceGeneratedAt: timestamp("intelligence_generated_at"),
  // Full CountryOpportunity object (frontend-shaped) kept in jsonb so the
  // rich profile round-trips without lossy column mapping.
  profile: jsonb("profile").notNull(),
  intelligenceData: text("intelligence_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  // Stable string key matching the frontend id (e.g. "comp1")
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  domain: text("domain"),
  industry: text("industry"),
  countrySlug: text("country_slug"),
  isoCode: text("iso_code"),
  employeeCount: integer("employee_count"),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("New Leads"),
  leadScore: real("lead_score"),
  aiScore: real("ai_score"),
  // Phase 2 (epic &1) company intelligence scores.
  aiReadinessScore: real("ai_readiness_score"),
  dataScienceScore: real("data_science_score"),
  dataEngineeringScore: real("data_engineering_score"),
  powerBiScore: real("power_bi_score"),
  cloudScore: real("cloud_score"),
  automationScore: real("automation_score"),
  opportunityScore: real("opportunity_score"),
  intelligenceSource: text("intelligence_source"),
  intelligenceGeneratedAt: timestamp("intelligence_generated_at"),
  // Full Company object (frontend-shaped) including scoring matrix, tech
  // stack, notes and activity timeline.
  profile: jsonb("profile").notNull(),
  analysisData: text("analysis_data"),
  // Phase 7 import tracking
  importSource: text("import_source"),
  importBatchId: text("import_batch_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const decisionMakers = pgTable("decision_makers", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  companySlug: text("company_slug"),
  name: text("name").notNull(),
  role: text("role"),
  email: text("email"),
  priorityScore: real("priority_score"),
  // Full DecisionMaker object (frontend-shaped).
  profile: jsonb("profile").notNull(),
  // Phase 7 import tracking
  importSource: text("import_source"),
  importBatchId: text("import_batch_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Phase 7: Import batch audit log
export const importBatches = pgTable("import_batches", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  filename: text("filename").notNull(),
  provider: text("provider").notNull().default("generic"),
  uploadedBy: integer("uploaded_by"),
  rowCount: integer("row_count").default(0),
  companiesCreated: integer("companies_created").default(0),
  companiesSkipped: integer("companies_skipped").default(0),
  decisionMakersCreated: integer("decision_makers_created").default(0),
  decisionMakersSkipped: integer("decision_makers_skipped").default(0),
  errorCount: integer("error_count").default(0),
  errorLog: jsonb("error_log"),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Legacy leads/outreaches tables retained for the existing AI routes.
export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  // SHA-256 hash of the opaque refresh token value (never store the raw value).
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  title: text("title").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  score: real("score"),
  status: varchar("status", { length: 50 }).default("New"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const outreaches = pgTable("outreaches", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  channel: varchar("channel", { length: 50 }).notNull(),
  content: text("content").notNull(),
  status: varchar("status", { length: 50 }).default("Draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relationships
export const companiesRelations = relations(companies, ({ many }) => ({
  leads: many(leads),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  company: one(companies, {
    fields: [leads.companyId],
    references: [companies.id],
  }),
  outreaches: many(outreaches),
}));

export const outreachesRelations = relations(outreaches, ({ one }) => ({
  lead: one(leads, {
    fields: [outreaches.leadId],
    references: [leads.id],
  }),
}));
