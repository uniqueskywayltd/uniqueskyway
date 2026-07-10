-- Move RLS helper functions out of the exposed public API schema.
-- Fixes Supabase advisor lint: authenticated_security_definer_function_executable
-- Functions remain SECURITY DEFINER for RLS; private schema is not exposed via PostgREST.

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated, postgres, service_role;

-- ---------------------------------------------------------------------------
-- RLS helpers (private schema — not callable via /rest/v1/rpc)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.current_profile_id()
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

CREATE OR REPLACE FUNCTION private.is_admin()
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

CREATE OR REPLACE FUNCTION private.admin_role()
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

REVOKE ALL ON FUNCTION private.current_profile_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.admin_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.current_profile_id() FROM anon;
REVOKE ALL ON FUNCTION private.is_admin() FROM anon;
REVOKE ALL ON FUNCTION private.admin_role() FROM anon;

GRANT EXECUTE ON FUNCTION private.current_profile_id() TO authenticated, postgres, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated, postgres, service_role;
GRANT EXECUTE ON FUNCTION private.admin_role() TO authenticated, postgres, service_role;

-- ---------------------------------------------------------------------------
-- Rewrite policies that reference public.* helpers
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
  roles_sql text;
  stmt text;
  new_qual text;
  new_with_check text;
BEGIN
  FOR pol IN
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname IN ('public', 'storage')
      AND (
        qual ~ '(public\.)?(is_admin|current_profile_id|admin_role)\('
        OR with_check ~ '(public\.)?(is_admin|current_profile_id|admin_role)\('
      )
  LOOP
    new_qual := pol.qual;
    new_with_check := pol.with_check;

    IF new_qual IS NOT NULL THEN
      new_qual := regexp_replace(new_qual, '(\m)(public\.)?current_profile_id\(\)', 'private.current_profile_id()', 'g');
      new_qual := regexp_replace(new_qual, '(\m)(public\.)?is_admin\(\)', 'private.is_admin()', 'g');
      new_qual := regexp_replace(new_qual, '(\m)(public\.)?admin_role\(\)', 'private.admin_role()', 'g');
    END IF;

    IF new_with_check IS NOT NULL THEN
      new_with_check := regexp_replace(new_with_check, '(\m)(public\.)?current_profile_id\(\)', 'private.current_profile_id()', 'g');
      new_with_check := regexp_replace(new_with_check, '(\m)(public\.)?is_admin\(\)', 'private.is_admin()', 'g');
      new_with_check := regexp_replace(new_with_check, '(\m)(public\.)?admin_role\(\)', 'private.admin_role()', 'g');
    END IF;

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname,
      pol.schemaname,
      pol.tablename
    );

    SELECT string_agg(format('%I', role_name), ', ')
    INTO roles_sql
    FROM unnest(pol.roles) AS role_name;

    stmt := format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
      pol.policyname,
      pol.schemaname,
      pol.tablename,
      CASE WHEN pol.permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      pol.cmd,
      roles_sql
    );

    IF new_qual IS NOT NULL THEN
      stmt := stmt || format(' USING (%s)', new_qual);
    END IF;

    IF new_with_check IS NOT NULL THEN
      stmt := stmt || format(' WITH CHECK (%s)', new_with_check);
    END IF;

    EXECUTE stmt;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Remove exposed public helpers (RPC endpoints)
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.current_profile_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_profile_id() FROM anon;
REVOKE ALL ON FUNCTION public.current_profile_id() FROM authenticated;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM authenticated;

REVOKE ALL ON FUNCTION public.admin_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_role() FROM anon;
REVOKE ALL ON FUNCTION public.admin_role() FROM authenticated;

DROP FUNCTION IF EXISTS public.current_profile_id();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.admin_role();
