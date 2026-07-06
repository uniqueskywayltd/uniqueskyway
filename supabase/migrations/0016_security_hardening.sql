-- Security hardening: Supabase advisor fixes (0016)
-- - set_updated_at search_path
-- - audit_logs insert policy
-- - revoke public RPC execute on internal SECURITY DEFINER functions
-- - RLS policies for tables with RLS enabled but no policies

-- ---------------------------------------------------------------------------
-- 1. set_updated_at — immutable search_path
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. audit_logs — remove permissive authenticated insert
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;

-- Inserts are performed server-side (service role bypasses RLS).

-- ---------------------------------------------------------------------------
-- 3. Function EXECUTE privileges — block direct PostgREST RPC abuse
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.prevent_ledger_entry_mutation()',
    'public.check_ledger_debit_balance()',
    'public.set_updated_at()'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO postgres, service_role', fn);
  END LOOP;
END;
$$;

-- RLS helpers: block anon RPC; keep authenticated for policy evaluation
DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.is_admin()',
    'public.current_profile_id()',
    'public.admin_role()'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, postgres, service_role', fn);
  END LOOP;
END;
$$;

-- rls_auto_enable may exist from Supabase extensions
DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM anon;
    REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO postgres, service_role;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. RLS policies for admin / server-managed tables
-- ---------------------------------------------------------------------------

-- customer_notes
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_notes_admin" ON public.customer_notes;
CREATE POLICY "customer_notes_admin"
  ON public.customer_notes FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- investment_events
ALTER TABLE public.investment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "investment_events_select" ON public.investment_events;
CREATE POLICY "investment_events_select"
  ON public.investment_events FOR SELECT
  TO authenticated
  USING (
    profile_id = public.current_profile_id()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "investment_events_admin_write" ON public.investment_events;
CREATE POLICY "investment_events_admin_write"
  ON public.investment_events FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- payment_methods — public read active methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_methods_public_read" ON public.payment_methods;
CREATE POLICY "payment_methods_public_read"
  ON public.payment_methods FOR SELECT
  TO authenticated
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "payment_methods_admin" ON public.payment_methods;
CREATE POLICY "payment_methods_admin"
  ON public.payment_methods FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- withdrawal_methods
ALTER TABLE public.withdrawal_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "withdrawal_methods_public_read" ON public.withdrawal_methods;
CREATE POLICY "withdrawal_methods_public_read"
  ON public.withdrawal_methods FOR SELECT
  TO authenticated
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "withdrawal_methods_admin" ON public.withdrawal_methods;
CREATE POLICY "withdrawal_methods_admin"
  ON public.withdrawal_methods FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- risk_events — admin only
ALTER TABLE public.risk_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "risk_events_admin" ON public.risk_events;
CREATE POLICY "risk_events_admin"
  ON public.risk_events FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- roi_processing_runs — admin only
ALTER TABLE public.roi_processing_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roi_processing_runs_admin" ON public.roi_processing_runs;
CREATE POLICY "roi_processing_runs_admin"
  ON public.roi_processing_runs FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- treasury_payouts — admin only
ALTER TABLE public.treasury_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treasury_payouts_admin" ON public.treasury_payouts;
CREATE POLICY "treasury_payouts_admin"
  ON public.treasury_payouts FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
