-- Run this in Supabase SQL Editor to add missing columns and tables
-- (Safe to run on existing database — uses IF NOT EXISTS)

-- Add missing columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_negative_feedback BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_weekly_summary BOOLEAN DEFAULT false;

-- Add missing column to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address TEXT;

-- Add missing columns to subscriptions (if table exists with old schema)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider_product_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider_variant_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Create webhook_events table (for idempotency)
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (provider, event_id)
);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Create indexes (IF NOT EXISTS is supported)
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_qr_codes_business_id ON qr_codes(business_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_slug ON qr_codes(slug);
CREATE INDEX IF NOT EXISTS idx_feedback_business_id ON feedback(business_id);
CREATE INDEX IF NOT EXISTS idx_feedback_qr_code_id ON feedback(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_business_id ON analytics_events(business_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_sub_id ON subscriptions(provider_subscription_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
