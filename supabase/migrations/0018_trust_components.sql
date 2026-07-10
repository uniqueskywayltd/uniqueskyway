-- Activity feed + trust component feature flags and settings
DO $$ BEGIN
  CREATE TYPE activity_feed_type AS ENUM (
    'registration',
    'deposit',
    'withdrawal',
    'investment',
    'referral',
    'roi_earned',
    'investment_matured',
    'announcement'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type activity_feed_type NOT NULL,
  title text,
  customer_name_masked text,
  city text,
  country text,
  amount numeric(18, 2),
  currency text NOT NULL DEFAULT 'USD',
  investment_plan text,
  is_seed boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_feed_type_idx ON activity_feed (type);
CREATE INDEX IF NOT EXISTS activity_feed_visible_idx ON activity_feed (is_visible);
CREATE INDEX IF NOT EXISTS activity_feed_seed_idx ON activity_feed (is_seed);
CREATE INDEX IF NOT EXISTS activity_feed_priority_idx ON activity_feed (priority);
CREATE INDEX IF NOT EXISTS activity_feed_created_at_idx ON activity_feed (created_at);

INSERT INTO feature_flags (key, enabled, description)
VALUES
  ('activity_feed_enabled', true, 'Show live activity ticker on the homepage'),
  ('seed_activity_enabled', true, 'Include seeded activity items in the homepage feed'),
  ('market_ticker_enabled', true, 'Show market overview strip below the header')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description, is_public)
VALUES
  (
    'activity_feed_config',
    '{"displayDurationMs":6000,"animationSpeedMs":400,"maxVisibleHistory":50,"minimumRealActivityBeforeDisablingSeedData":25,"seedEnabled":true}'::jsonb,
    'Homepage activity feed display and seed behaviour',
    false
  ),
  (
    'market_ticker_config',
    '{"provider":"mock","refreshIntervalSeconds":300,"cacheDurationSeconds":300,"visibleAssets":["btc","eth","sol","bnb","gold","silver","crude_oil","sp500","nasdaq","dxy","eur_usd","gbp_usd"]}'::jsonb,
    'Market overview ticker assets, provider, and refresh settings',
    false
  )
ON CONFLICT (key) DO NOTHING;
