-- =============================================================================
-- Row Level Security policies
-- =============================================================================

-- Helper: current user's profile id
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles
  WHERE auth_user_id = auth.uid()
    AND deleted_at IS NULL
  LIMIT 1;
$$;

-- Helper: check if current user is an active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
      AND is_active = true
      AND deleted_at IS NULL
  );
$$;

-- Helper: check admin role
CREATE OR REPLACE FUNCTION public.admin_role()
RETURNS admin_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM admin_users
  WHERE auth_user_id = auth.uid()
    AND is_active = true
    AND deleted_at IS NULL
  LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "profiles_admin_all"
  ON profiles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- admin_users — admins only
-- ---------------------------------------------------------------------------
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_users_admin_only"
  ON admin_users FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_users_read_own"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ledger_accounts & ledger_entries
-- ---------------------------------------------------------------------------
ALTER TABLE ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ledger_accounts_select"
  ON ledger_accounts FOR SELECT
  TO authenticated
  USING (
    profile_id = public.current_profile_id()
    OR public.is_admin()
  );

CREATE POLICY "ledger_entries_select"
  ON ledger_entries FOR SELECT
  TO authenticated
  USING (
    account_id IN (
      SELECT id FROM ledger_accounts
      WHERE profile_id = public.current_profile_id()
    )
    OR public.is_admin()
  );

-- Inserts via service role only (no direct client inserts)
CREATE POLICY "ledger_entries_insert_service"
  ON ledger_entries FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- deposit_requests & withdrawal_requests
-- ---------------------------------------------------------------------------
ALTER TABLE deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deposits_select_own"
  ON deposit_requests FOR SELECT
  TO authenticated
  USING (
    profile_id = public.current_profile_id()
    OR public.is_admin()
  );

CREATE POLICY "deposits_insert_own"
  ON deposit_requests FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = public.current_profile_id());

CREATE POLICY "deposits_admin_manage"
  ON deposit_requests FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "withdrawals_select_own"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (
    profile_id = public.current_profile_id()
    OR public.is_admin()
  );

CREATE POLICY "withdrawals_insert_own"
  ON withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = public.current_profile_id());

CREATE POLICY "withdrawals_admin_manage"
  ON withdrawal_requests FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- investments & investment_plans
-- ---------------------------------------------------------------------------
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "investments_select"
  ON investments FOR SELECT
  TO authenticated
  USING (
    profile_id = public.current_profile_id()
    OR public.is_admin()
  );

CREATE POLICY "investment_plans_public_read"
  ON investment_plans FOR SELECT
  TO authenticated, anon
  USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "investment_plans_admin_manage"
  ON investment_plans FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- referrals
-- ---------------------------------------------------------------------------
ALTER TABLE referral_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_select"
  ON referral_relationships FOR SELECT
  TO authenticated
  USING (
    referrer_profile_id = public.current_profile_id()
    OR referred_profile_id = public.current_profile_id()
    OR public.is_admin()
  );

CREATE POLICY "referral_commissions_select"
  ON referral_commissions FOR SELECT
  TO authenticated
  USING (
    referrer_profile_id = public.current_profile_id()
    OR public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    profile_id = public.current_profile_id()
    OR admin_user_id IN (
      SELECT id FROM admin_users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  TO authenticated
  USING (profile_id = public.current_profile_id())
  WITH CHECK (profile_id = public.current_profile_id());

-- ---------------------------------------------------------------------------
-- governance tables
-- ---------------------------------------------------------------------------
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_flags_public_read"
  ON feature_flags FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "feature_flags_admin_write"
  ON feature_flags FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "settings_public_read"
  ON system_settings FOR SELECT
  TO authenticated, anon
  USING (is_public = true OR public.is_admin());

CREATE POLICY "settings_admin_write"
  ON system_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- audit_logs — admin read only, append via service
-- ---------------------------------------------------------------------------
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_admin_read"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "audit_logs_insert"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- login_history & user_sessions
-- ---------------------------------------------------------------------------
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "login_history_own"
  ON login_history FOR SELECT
  TO authenticated
  USING (
    profile_id = public.current_profile_id()
    OR public.is_admin()
  );

CREATE POLICY "sessions_own"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (
    profile_id = public.current_profile_id()
    OR public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- permissions — admin only
-- ---------------------------------------------------------------------------
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permissions_admin"
  ON permissions FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "role_permissions_admin"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- legacy archive — admin only, read-only
-- ---------------------------------------------------------------------------
ALTER TABLE legacy_transactions_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "legacy_archive_admin_read"
  ON legacy_transactions_archive FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- notification_events — service/admin only
-- ---------------------------------------------------------------------------
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_events_admin"
  ON notification_events FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Balance views — inherit RLS from underlying tables via security_invoker
-- ---------------------------------------------------------------------------
GRANT SELECT ON public.ledger_account_balances TO authenticated;
GRANT SELECT ON public.profile_wallet_summary TO authenticated;
