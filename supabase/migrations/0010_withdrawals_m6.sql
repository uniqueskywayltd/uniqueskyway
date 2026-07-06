-- M6: Withdrawal workflow, treasury operations, risk events

-- Extend withdrawal status enum
ALTER TYPE withdrawal_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE withdrawal_status ADD VALUE IF NOT EXISTS 'submitted';
ALTER TYPE withdrawal_status ADD VALUE IF NOT EXISTS 'under_review';

CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE payout_provider_type AS ENUM ('manual', 'api');
CREATE TYPE risk_severity AS ENUM ('low', 'medium', 'high');
CREATE TYPE risk_event_type AS ENUM (
  'large_withdrawal',
  'multiple_withdrawals',
  'device_change',
  'new_login_location',
  'high_risk_pattern'
);

-- Configurable withdrawal methods (database-driven, not hardcoded)
CREATE TABLE IF NOT EXISTS withdrawal_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  method_type payment_method_type NOT NULL,
  description text,
  instructions text,
  requires_destination boolean NOT NULL DEFAULT true,
  min_amount numeric(18, 2),
  max_amount numeric(18, 2),
  config jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS withdrawal_methods_active_idx ON withdrawal_methods (is_active);
CREATE INDEX IF NOT EXISTS withdrawal_methods_slug_idx ON withdrawal_methods (slug);

INSERT INTO withdrawal_methods (slug, name, method_type, description, instructions, config, sort_order)
VALUES
  (
    'usdt_trc20',
    'USDT (TRC20)',
    'cryptocurrency',
    'Withdraw to a USDT TRC20 wallet address',
    'Enter your TRC20 USDT wallet address. Ensure the network matches TRC20.',
    '{"network": "TRC20", "asset": "USDT"}'::jsonb,
    1
  ),
  (
    'bitcoin',
    'Bitcoin',
    'cryptocurrency',
    'Withdraw to a Bitcoin wallet address',
    'Enter your Bitcoin (BTC) wallet address.',
    '{"network": "BTC", "asset": "BTC"}'::jsonb,
    2
  ),
  (
    'ethereum',
    'Ethereum',
    'cryptocurrency',
    'Withdraw to an Ethereum wallet address',
    'Enter your Ethereum (ETH) wallet address.',
    '{"network": "ETH", "asset": "ETH"}'::jsonb,
    3
  ),
  (
    'bank_transfer',
    'Bank Transfer',
    'bank_transfer',
    'Withdraw via bank wire or ACH',
    'Provide your bank account details. Transfers may take 3–5 business days.',
    '{"fields": ["account_name", "account_number", "routing_number", "bank_name"]}'::jsonb,
    4
  )
ON CONFLICT (slug) DO NOTHING;

-- Treasury payout queue (provider-independent)
CREATE TABLE IF NOT EXISTS treasury_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_request_id uuid NOT NULL REFERENCES withdrawal_requests(id),
  provider_type payout_provider_type NOT NULL DEFAULT 'manual',
  provider_slug text NOT NULL DEFAULT 'manual',
  status payout_status NOT NULL DEFAULT 'pending',
  amount numeric(18, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  destination_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  external_reference text,
  failure_reason text,
  processed_by_admin_id uuid,
  processed_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS treasury_payouts_status_idx ON treasury_payouts (status);
CREATE INDEX IF NOT EXISTS treasury_payouts_withdrawal_id_idx ON treasury_payouts (withdrawal_request_id);

-- Risk event foundation (no automatic blocking)
CREATE TABLE IF NOT EXISTS risk_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id),
  withdrawal_request_id uuid REFERENCES withdrawal_requests(id),
  event_type risk_event_type NOT NULL,
  severity risk_severity NOT NULL DEFAULT 'low',
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS risk_events_profile_id_idx ON risk_events (profile_id);
CREATE INDEX IF NOT EXISTS risk_events_withdrawal_id_idx ON risk_events (withdrawal_request_id);
CREATE INDEX IF NOT EXISTS risk_events_type_idx ON risk_events (event_type);

-- Extend withdrawal_requests
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS withdrawal_method_id uuid REFERENCES withdrawal_methods(id);
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS destination_details jsonb DEFAULT '{}'::jsonb;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS internal_notes text;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS info_request_message text;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS processing_at timestamptz;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS payout_reference text;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS treasury_payout_id uuid REFERENCES treasury_payouts(id);

CREATE INDEX IF NOT EXISTS withdrawal_requests_method_id_idx ON withdrawal_requests (withdrawal_method_id);
CREATE INDEX IF NOT EXISTS withdrawal_requests_submitted_at_idx ON withdrawal_requests (submitted_at);

-- Withdrawal limits in system settings
INSERT INTO system_settings (key, value, description, is_public)
VALUES
  ('maximum_withdrawal', 'null', 'Maximum single withdrawal amount', false),
  ('daily_withdrawal_limit', 'null', 'Maximum total withdrawals per customer per day', false)
ON CONFLICT (key) DO NOTHING;
