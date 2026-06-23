-- Security sprint (Tasks #1/#2/#8): refresh token storage.
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamp NOT NULL,
  "revoked_at" timestamp,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_idx" ON "refresh_tokens" ("user_id");
