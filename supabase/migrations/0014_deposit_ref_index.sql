-- Post-enum deposit data fixes (must run after 0009 enum values commit)
UPDATE deposit_requests SET status = 'submitted' WHERE status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS deposit_requests_external_ref_unique_idx
  ON deposit_requests (external_transaction_ref)
  WHERE status NOT IN ('rejected', 'cancelled', 'draft');
