# Rollback Plan — Unique Sky Way Migration

## Scope

Rollback is available **before production cutover is declared complete**. After customers actively use the new platform with new transactions, rollback requires manual reconciliation.

## Automated Rollback

### Via Admin Dashboard
1. Go to `/admin/migration`
2. Find the live migration run
3. Click **Rollback**
4. Confirm the action

### Via API
```http
POST /api/admin/migration/{runId}
Content-Type: application/json

{ "action": "rollback" }
```

### What Rollback Deletes (per run)
- Migrated `profiles` and Supabase Auth users
- `ledger_entries`, `ledger_accounts`
- `investments`, `deposit_requests`, `withdrawal_requests`
- `referral_relationships`, `referral_commissions`
- `migration_idempotency` records for the run

### What Rollback Preserves
- `legacy_transactions_archive` (historical audit)
- `migration_runs`, `migration_reports`, `migration_checkpoints`
- `migration_balance_exceptions` (for analysis)
- Pre-migration admin accounts
- System settings, plans, payment methods

## Manual Rollback (Post-Cutover)

If rollback is needed after cutover:

1. Enable maintenance mode immediately
2. Stop ROI cron job
3. Export all new-platform transactions since cutover
4. Revert DNS to legacy platform
5. Document delta for manual reconciliation
6. Notify affected customers

## DNS Rollback

1. Revert A/CNAME records to legacy hosting
2. TTL: allow up to 1 hour for propagation
3. Verify legacy site responds correctly

## Communication Template

> We are performing emergency maintenance on the Unique Sky Way platform. Your funds remain secure. The legacy portal is temporarily restored. We will notify you when the upgraded platform is available again.

## Recovery After Failed Rollback

1. Check Supabase Auth for orphaned users
2. Run `migration_balance_exceptions` report
3. Contact Supabase support if storage corruption suspected
4. Re-run dry migration against clean schema before retry

## Testing Rollback

Before cutover, test rollback on staging:
1. Run live migration on staging DB
2. Verify customer count and balances
3. Execute rollback
4. Confirm DB returns to pre-migration state
5. Re-run migration to confirm idempotency
