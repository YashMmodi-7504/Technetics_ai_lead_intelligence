-- Add missing indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_lead_score ON companies(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_companies_country_slug ON companies(country_slug);
CREATE INDEX IF NOT EXISTS idx_decision_makers_company_slug ON decision_makers(company_slug);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
