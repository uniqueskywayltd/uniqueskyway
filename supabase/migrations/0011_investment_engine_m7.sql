-- M7: Investment engine, ROI processing, plans, events

CREATE TYPE roi_run_status AS ENUM ('running', 'completed', 'failed', 'dry_run');
CREATE TYPE roi_run_mode AS ENUM ('daily', 'single', 'recovery', 'dry_run');
CREATE TYPE investment_event_type AS ENUM (
  'created',
  'activated',
  'roi_accrued',
  'reinvested',
  'matured',
  'closed',
  'paused',
  'resumed',
  'force_matured'
);

-- Extend investment plans (flexible admin-manageable model)
ALTER TABLE investment_plans ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
ALTER TABLE investment_plans ADD COLUMN IF NOT EXISTS compounding boolean NOT NULL DEFAULT false;
ALTER TABLE investment_plans ADD COLUMN IF NOT EXISTS grace_period_days integer NOT NULL DEFAULT 0;
ALTER TABLE investment_plans ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

-- Extend investments
ALTER TABLE investments ADD COLUMN IF NOT EXISTS is_paused boolean NOT NULL DEFAULT false;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS paused_at timestamptz;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS activated_at timestamptz;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS total_roi_credited numeric(18, 2) NOT NULL DEFAULT 0;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS referral_commission_paid boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS investments_last_accrual_idx ON investments (last_accrual_at);
CREATE INDEX IF NOT EXISTS investments_matures_at_idx ON investments (matures_at);

-- ROI processing logs
CREATE TABLE IF NOT EXISTS roi_processing_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode roi_run_mode NOT NULL,
  status roi_run_status NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  investments_processed integer NOT NULL DEFAULT 0,
  investments_matured integer NOT NULL DEFAULT 0,
  roi_generated numeric(18, 2) NOT NULL DEFAULT 0,
  commissions_generated numeric(18, 2) NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  duration_ms integer,
  target_investment_id uuid REFERENCES investments(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS roi_processing_runs_started_at_idx ON roi_processing_runs (started_at DESC);
CREATE INDEX IF NOT EXISTS roi_processing_runs_status_idx ON roi_processing_runs (status);

-- Investment activity timeline
CREATE TABLE IF NOT EXISTS investment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id uuid NOT NULL REFERENCES investments(id),
  profile_id uuid NOT NULL REFERENCES profiles(id),
  event_type investment_event_type NOT NULL,
  title text NOT NULL,
  description text,
  amount numeric(18, 2),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS investment_events_investment_id_idx ON investment_events (investment_id);
CREATE INDEX IF NOT EXISTS investment_events_profile_id_idx ON investment_events (profile_id);
CREATE INDEX IF NOT EXISTS investment_events_type_idx ON investment_events (event_type);

-- Referral commission idempotency
ALTER TABLE referral_commissions ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;
ALTER TABLE referral_commissions ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'paid';

-- Seed investment plans (configurable — reproduces legacy tier structure)
INSERT INTO investment_plans (
  slug, name, description, daily_roi_percent, max_roi_percent,
  min_deposit, max_deposit, duration_days, lock_period_days,
  referral_commission_percent, reinvest_enabled, max_reinvest_cycles,
  is_active, is_visible, sort_order, currency
)
VALUES
  (
    'silver',
    'Silver Plan',
    'Entry-level plan with a 4-day duration and 4% daily return.',
    4.0000, 16.0000,
    50.00, 25000.00, 4, 0,
    10.0000, true, 2,
    true, true, 1, 'USD'
  ),
  (
    'gold',
    'Gold Plan',
    'Mid-tier plan with a 7-day duration and 5.5% daily return.',
    5.5000, 38.5000,
    25000.00, 50000.00, 7, 0,
    10.0000, true, 2,
    true, true, 2, 'USD'
  ),
  (
    'classic',
    'Classic Plan',
    'Premium plan with a 14-day duration and 6% daily return.',
    6.0000, 84.0000,
    50000.00, 100000.00, 14, 0,
    10.0000, true, 2,
    true, true, 3, 'USD'
  ),
  (
    'master',
    'Master Plan',
    'Elite plan with a 30-day duration and 10% daily return.',
    10.0000, 300.0000,
    100000.00, NULL, 30, 0,
    10.0000, true, 2,
    true, true, 4, 'USD'
  )
ON CONFLICT (slug) DO NOTHING;
