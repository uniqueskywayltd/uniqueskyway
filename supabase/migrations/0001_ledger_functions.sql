-- =============================================================================
-- Ledger integrity: constraints, functions, and views
-- Balances are ALWAYS derived from ledger_entries — never stored directly.
-- =============================================================================

-- Positive amounts only
ALTER TABLE ledger_entries
  ADD CONSTRAINT ledger_entries_amount_positive
  CHECK (amount > 0);

-- ---------------------------------------------------------------------------
-- Balance calculation function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_ledger_account_balance(p_account_id uuid)
RETURNS numeric(18, 2)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    SUM(
      CASE
        WHEN direction = 'credit' THEN amount
        ELSE -amount
      END
    ),
    0
  )::numeric(18, 2)
  FROM ledger_entries
  WHERE account_id = p_account_id;
$$;

-- ---------------------------------------------------------------------------
-- Balance view — read-only derived balances per account
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.ledger_account_balances
WITH (security_invoker = true)
AS
SELECT
  la.id AS account_id,
  la.profile_id,
  la.account_type,
  la.currency,
  public.get_ledger_account_balance(la.id) AS balance,
  la.created_at,
  la.updated_at
FROM ledger_accounts la;

-- ---------------------------------------------------------------------------
-- Profile-level balance summary view
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.profile_wallet_summary
WITH (security_invoker = true)
AS
SELECT
  p.id AS profile_id,
  p.email,
  la.currency,
  SUM(public.get_ledger_account_balance(la.id)) AS total_balance,
  SUM(
    CASE WHEN la.account_type = 'available'
      THEN public.get_ledger_account_balance(la.id)
      ELSE 0
    END
  ) AS available_balance,
  SUM(
    CASE WHEN la.account_type = 'invested'
      THEN public.get_ledger_account_balance(la.id)
      ELSE 0
    END
  ) AS invested_balance,
  SUM(
    CASE WHEN la.account_type = 'referral'
      THEN public.get_ledger_account_balance(la.id)
      ELSE 0
    END
  ) AS referral_balance
FROM profiles p
LEFT JOIN ledger_accounts la ON la.profile_id = p.id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.email, la.currency;

-- ---------------------------------------------------------------------------
-- Immutability: ledger entries are append-only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_ledger_entry_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'ledger_entries are immutable — updates and deletes are not permitted';
END;
$$;

CREATE TRIGGER ledger_entries_immutable_update
  BEFORE UPDATE ON ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ledger_entry_mutation();

CREATE TRIGGER ledger_entries_immutable_delete
  BEFORE DELETE ON ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ledger_entry_mutation();

-- ---------------------------------------------------------------------------
-- Pre-insert balance check for debits (database-level safety net)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_ledger_debit_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance numeric(18, 2);
  allow_negative boolean;
BEGIN
  IF NEW.direction = 'debit' THEN
    allow_negative := COALESCE(
      (NEW.metadata::jsonb ->> 'allow_negative')::boolean,
      false
    );

    IF NEW.entry_type = 'admin_adjustment' THEN
      allow_negative := true;
    END IF;

    IF NOT allow_negative THEN
      current_balance := public.get_ledger_account_balance(NEW.account_id);
      IF current_balance < NEW.amount THEN
        RAISE EXCEPTION 'Insufficient balance: available %, requested %',
          current_balance, NEW.amount;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER ledger_entries_check_balance
  BEFORE INSERT ON ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.check_ledger_debit_balance();

-- ---------------------------------------------------------------------------
-- Updated_at trigger for all tables with updated_at column
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'profiles', 'admin_users', 'investment_plans', 'investments',
      'ledger_accounts', 'deposit_requests', 'withdrawal_requests',
      'referral_relationships', 'referral_commissions', 'feature_flags',
      'system_settings', 'permissions', 'notifications', 'notification_events'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;
