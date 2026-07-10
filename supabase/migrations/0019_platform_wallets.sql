-- =============================================================================
-- Platform Wallets — Phase 1 manual deposit wallet management
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE platform_wallet_status AS ENUM ('active', 'inactive', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS platform_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_symbol TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  network TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  qr_code_path TEXT,
  instructions TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status platform_wallet_status NOT NULL DEFAULT 'active',
  auto_detection_enabled BOOLEAN NOT NULL DEFAULT false,
  required_confirmations INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  color TEXT,
  created_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS platform_wallets_status_idx ON platform_wallets(status);
CREATE INDEX IF NOT EXISTS platform_wallets_active_idx ON platform_wallets(is_active);
CREATE INDEX IF NOT EXISTS platform_wallets_display_order_idx ON platform_wallets(display_order);
CREATE INDEX IF NOT EXISTS platform_wallets_asset_network_idx ON platform_wallets(asset_symbol, network);

-- Deposit wallet snapshots (historical preservation)
ALTER TABLE deposit_requests
  ADD COLUMN IF NOT EXISTS platform_wallet_id UUID REFERENCES platform_wallets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS wallet_address_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS asset_symbol_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS asset_name_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS network_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS qr_code_path_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS wallet_instructions_snapshot TEXT;

CREATE INDEX IF NOT EXISTS deposit_requests_platform_wallet_id_idx
  ON deposit_requests(platform_wallet_id);

-- Feature flag
INSERT INTO feature_flags (key, enabled, description) VALUES
  ('platform_wallets_enabled', false, 'Allow customers to deposit via configured platform wallets')
ON CONFLICT (key) DO NOTHING;

-- Permissions
INSERT INTO permissions (slug, name, description, category) VALUES
  ('platform_wallets.read', 'View Platform Wallets', 'View platform wallet configuration', 'finance'),
  ('platform_wallets.manage', 'Manage Platform Wallets', 'Create and modify platform wallets', 'finance')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'super_admin'::admin_role, p.id
FROM permissions p
WHERE p.slug IN ('platform_wallets.read', 'platform_wallets.manage')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'administrator'::admin_role, p.id
FROM permissions p
WHERE p.slug IN ('platform_wallets.read', 'platform_wallets.manage')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'finance_manager'::admin_role, p.id
FROM permissions p
WHERE p.slug IN ('platform_wallets.read', 'platform_wallets.manage')
ON CONFLICT DO NOTHING;

-- Storage bucket for wallet QR codes (public read — addresses are shown to customers)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wallet-qr',
  'wallet-qr',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "wallet_qr_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'wallet-qr');

CREATE POLICY "wallet_qr_admin_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'wallet-qr' AND public.is_admin());

CREATE POLICY "wallet_qr_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'wallet-qr' AND public.is_admin());

CREATE POLICY "wallet_qr_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'wallet-qr' AND public.is_admin());
