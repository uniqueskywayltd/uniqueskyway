-- M5: Deposit workflow, payment methods, investment linkage

-- Extend deposit status enum
ALTER TYPE deposit_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE deposit_status ADD VALUE IF NOT EXISTS 'submitted';
ALTER TYPE deposit_status ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE deposit_status ADD VALUE IF NOT EXISTS 'processing';

-- Payment method types
CREATE TYPE payment_method_type AS ENUM ('cryptocurrency', 'bank_transfer', 'manual', 'gateway');

CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  method_type payment_method_type NOT NULL,
  description text,
  instructions text,
  requires_proof boolean NOT NULL DEFAULT true,
  min_amount numeric(18, 2),
  max_amount numeric(18, 2),
  config jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_methods_active_idx ON payment_methods (is_active);
CREATE INDEX IF NOT EXISTS payment_methods_slug_idx ON payment_methods (slug);

-- Seed configurable payment methods (admin-manageable)
INSERT INTO payment_methods (slug, name, method_type, description, instructions, requires_proof, sort_order)
VALUES
  (
    'cryptocurrency',
    'Cryptocurrency',
    'cryptocurrency',
    'Pay via supported cryptocurrency networks',
    'Send the exact amount to the wallet address provided after submission. Upload your transaction hash as proof.',
    true,
    1
  ),
  (
    'bank_transfer',
    'Bank Transfer',
    'bank_transfer',
    'Wire or ACH bank transfer',
    'Transfer funds using the banking details provided after submission. Include your reference ID in the transfer memo.',
    true,
    2
  ),
  (
    'manual',
    'Manual Payment',
    'manual',
    'Manual payment verification',
    'Contact support for manual payment instructions. Upload proof of payment after completing the transfer.',
    true,
    3
  )
ON CONFLICT (slug) DO NOTHING;

-- Extend deposit_requests
ALTER TABLE deposit_requests ADD COLUMN IF NOT EXISTS payment_method_id uuid REFERENCES payment_methods(id);
ALTER TABLE deposit_requests ADD COLUMN IF NOT EXISTS proof_storage_path text;
ALTER TABLE deposit_requests ADD COLUMN IF NOT EXISTS internal_notes text;
ALTER TABLE deposit_requests ADD COLUMN IF NOT EXISTS info_request_message text;
ALTER TABLE deposit_requests ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
ALTER TABLE deposit_requests ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
ALTER TABLE deposit_requests ADD COLUMN IF NOT EXISTS investment_id uuid REFERENCES investments(id);
ALTER TABLE deposit_requests ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;
ALTER TABLE deposit_requests ADD COLUMN IF NOT EXISTS approved_at timestamptz;

CREATE INDEX IF NOT EXISTS deposit_requests_payment_method_id_idx ON deposit_requests (payment_method_id);
CREATE INDEX IF NOT EXISTS deposit_requests_investment_id_idx ON deposit_requests (investment_id);

-- Link investments to deposits
ALTER TABLE investments ADD COLUMN IF NOT EXISTS deposit_request_id uuid REFERENCES deposit_requests(id);
CREATE INDEX IF NOT EXISTS investments_deposit_request_id_idx ON investments (deposit_request_id);

-- Payment proofs storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "payment_proofs_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

CREATE POLICY "payment_proofs_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
