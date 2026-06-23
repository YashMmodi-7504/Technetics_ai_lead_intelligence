CREATE TABLE "import_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"filename" text NOT NULL,
	"provider" text DEFAULT 'generic' NOT NULL,
	"uploaded_by" integer,
	"row_count" integer DEFAULT 0,
	"companies_created" integer DEFAULT 0,
	"companies_skipped" integer DEFAULT 0,
	"decision_makers_created" integer DEFAULT 0,
	"decision_makers_skipped" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"error_log" jsonb,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	CONSTRAINT "import_batches_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "import_source" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "import_batch_id" text;--> statement-breakpoint
ALTER TABLE "decision_makers" ADD COLUMN "import_source" text;--> statement-breakpoint
ALTER TABLE "decision_makers" ADD COLUMN "import_batch_id" text;