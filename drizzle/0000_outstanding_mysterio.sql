CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"industry" text,
	"country_slug" text,
	"iso_code" text,
	"employee_count" integer,
	"description" text,
	"status" varchar(50) DEFAULT 'New Leads',
	"lead_score" real,
	"ai_score" real,
	"ai_readiness_score" real,
	"data_science_score" real,
	"data_engineering_score" real,
	"power_bi_score" real,
	"cloud_score" real,
	"automation_score" real,
	"opportunity_score" real,
	"intelligence_source" text,
	"intelligence_generated_at" timestamp,
	"profile" jsonb NOT NULL,
	"analysis_data" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"iso_code" text,
	"opportunity_score" real,
	"demand_scores" jsonb,
	"skill_rankings" jsonb,
	"recommended_services" jsonb,
	"demand_overall" real,
	"intelligence_source" text,
	"intelligence_generated_at" timestamp,
	"profile" jsonb NOT NULL,
	"intelligence_data" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "countries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "decision_makers" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"company_slug" text,
	"name" text NOT NULL,
	"role" text,
	"email" text,
	"priority_score" real,
	"profile" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "decision_makers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer,
	"title" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"score" real,
	"status" varchar(50) DEFAULT 'New',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "outreaches" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"channel" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"status" varchar(50) DEFAULT 'Draft',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreaches" ADD CONSTRAINT "outreaches_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;