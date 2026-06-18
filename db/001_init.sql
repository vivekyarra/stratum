CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS neighborhoods (
  geohash_4 VARCHAR(4) PRIMARY KEY,
  city_id VARCHAR(50),
  display_name VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS neighborhood_scores (
  id SERIAL PRIMARY KEY,
  geohash_4 VARCHAR(4) REFERENCES neighborhoods,
  safety_score DECIMAL(4,1),
  vibe_score DECIMAL(4,1),
  infrastructure_score DECIMAL(4,1),
  opportunity_score DECIMAL(4,1),
  overall_score DECIMAL(4,1),
  report_count_24h INTEGER DEFAULT 0,
  report_count_7d INTEGER DEFAULT 0,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  plan_type VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  org_name VARCHAR(200),
  plan_type VARCHAR(20),
  api_key VARCHAR(64) UNIQUE NOT NULL,
  monthly_calls_limit INTEGER DEFAULT 10000,
  calls_this_month INTEGER DEFAULT 0,
  stripe_subscription_id VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_call_logs (
  id BIGSERIAL PRIMARY KEY,
  api_key VARCHAR(64),
  endpoint VARCHAR(100),
  city_id VARCHAR(50),
  called_at TIMESTAMPTZ DEFAULT NOW(),
  response_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_neighborhoods_city_id ON neighborhoods(city_id);
CREATE INDEX IF NOT EXISTS idx_scores_geohash_calculated ON neighborhood_scores(geohash_4, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_key_time ON api_call_logs(api_key, called_at DESC);
