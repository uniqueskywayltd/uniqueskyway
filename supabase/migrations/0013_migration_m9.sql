-- M9: Legacy migration engine — run tracking, idempotency, verification

CREATE TYPE migration_phase AS ENUM (
  'extract', 'validate', 'transform', 'load', 'verify', 'report'
);

CREATE TYPE migration_run_status AS ENUM (
  'pending', 'running', 'paused', 'completed', 'failed', 'rolled_back'
);

CREATE TABLE IF NOT EXISTS migration_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_key text NOT NULL UNIQUE,
  label text,
  status migration_run_status NOT NULL DEFAULT 'pending',
  dry_run boolean NOT NULL DEFAULT true,
  current_phase migration_phase,
  source_path text NOT NULL,
  started_by_admin_id uuid REFERENCES admin_users(id),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  stats jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS migration_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES migration_runs(id) ON DELETE CASCADE,
  phase migration_phase NOT NULL,
  entity_type text NOT NULL,
  last_legacy_id integer,
  processed_count integer NOT NULL DEFAULT 0,
  cursor_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS migration_idempotency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES migration_runs(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  legacy_id integer NOT NULL,
  new_entity_id uuid,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS migration_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES migration_runs(id) ON DELETE CASCADE,
  report_type text NOT NULL,
  title text NOT NULL,
  summary text,
  payload jsonb NOT NULL,
  file_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS migration_balance_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES migration_runs(id) ON DELETE CASCADE,
  legacy_user_id integer NOT NULL,
  profile_id uuid REFERENCES profiles(id),
  email text NOT NULL,
  legacy_available numeric(18, 2) NOT NULL,
  new_available numeric(18, 2) NOT NULL,
  legacy_invested numeric(18, 2) NOT NULL,
  new_invested numeric(18, 2) NOT NULL,
  legacy_total numeric(18, 2) NOT NULL,
  new_total numeric(18, 2) NOT NULL,
  difference numeric(18, 2) NOT NULL,
  details jsonb,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS migration_runs_status_idx ON migration_runs(status);
CREATE INDEX IF NOT EXISTS migration_checkpoints_run_idx ON migration_checkpoints(run_id);
CREATE INDEX IF NOT EXISTS migration_idempotency_run_idx ON migration_idempotency(run_id);
CREATE INDEX IF NOT EXISTS migration_idempotency_legacy_idx ON migration_idempotency(entity_type, legacy_id);
CREATE INDEX IF NOT EXISTS migration_reports_run_idx ON migration_reports(run_id);
CREATE INDEX IF NOT EXISTS migration_balance_exceptions_run_idx ON migration_balance_exceptions(run_id);

-- Migration permission — super_admin only
INSERT INTO permissions (slug, name, description, category)
VALUES ('migration.run', 'Run Legacy Migration', 'Execute and manage legacy data migration', 'system')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'super_admin', id FROM permissions WHERE slug = 'migration.run'
ON CONFLICT DO NOTHING;

-- RLS: migration tables admin-only via service role (no public policies)
ALTER TABLE migration_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_balance_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY migration_runs_admin ON migration_runs FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY migration_checkpoints_admin ON migration_checkpoints FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY migration_idempotency_admin ON migration_idempotency FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY migration_reports_admin ON migration_reports FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY migration_balance_exceptions_admin ON migration_balance_exceptions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
