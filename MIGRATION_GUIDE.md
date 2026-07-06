# Legacy Migration Guide — Unique Sky Way

This guide documents the Milestone 9 ETL pipeline for migrating data from the legacy PHP/MariaDB platform into the new Next.js + Supabase architecture.

## Principles

1. **Legacy is immutable** — The SQL dump (`u973246624_uniqueskyway.20260623211625.sql`) and PHP codebase are never modified.
2. **Ledger-driven** — All financial events become immutable `ledger_entries`. No direct balance updates.
3. **Idempotent** — Every entity uses `migration_idempotency` keys. Re-running is safe.
4. **Auditable** — Full archive in `legacy_transactions_archive` with raw payloads.
5. **Reversible** — Rollback before cutover removes all records linked to a migration run.

## Architecture

```
Phase 1: Extract    → Parse SQL dump (users, transactions, admins)
Phase 2: Validate   → Referral graph, orphan txs, balance pre-check
Phase 3: Transform  → Map to profiles, investments, ledger entries
Phase 4: Load       → Supabase Auth + Postgres (skip in dry-run)
Phase 5: Verify     → Per-customer legacy vs ledger balance comparison
Phase 6: Report     → Human-readable JSON + TXT reports
```

## Source Data

| Legacy Table | Records | New Target |
|-------------|---------|------------|
| `users` | 16 | `profiles` + Supabase Auth |
| `transactions` | 455 | `ledger_entries`, `investments`, archive |
| `admin` | 1 | Manual bootstrap (not auto-migrated) |

## Mapping Rules

### Users
- `u_id` → `profiles.legacy_user_id`
- `user_name` → `username`, `referral_code`
- `ref` URL → `referral_relationships` via referrer username
- `passport` → avatar filename in `u_images/`
- Passwords: **never imported** — random temp password + `password_reset_required` metadata

### Transactions
| Legacy Type | Ledger Account | Entry Type |
|------------|----------------|------------|
| Credit | invested (+ available for interest) | investment_principal, investment_interest |
| Referral | available | referral_commission |
| Reinvest | available (debit) + invested (credit) | reinvestment, investment_principal |
| Debit (confirmed) | available | withdrawal |
| Debit (pending) | pending_withdrawal | withdrawal |

### Investment Plans
Legacy plan names map to slugs: Silver → `silver`, Gold → `gold`, Classic → `classic`, Master → `master`, Starter → `silver`.

## Running Migration

### Offline validation (no database)
```bash
cd platform
npm run migration:dry-run
```

### Full pipeline via CLI (requires DATABASE_URL)
```bash
npm run migration -- --phase=all          # dry run (default)
npm run migration -- --live               # live import
npm run migration -- --live --skip-images # skip avatar upload
```

### Admin dashboard
Navigate to `/admin/migration` (Super Admin only).

1. Enable **Dry run** checkbox
2. Click **Run Dry Migration**
3. Review balance exceptions (must be 0.00)
4. Uncheck dry run for live import before cutover

## Balance Verification

Legacy balance replicates `dashboard/dashboard.php`:
- Total = credits + interest − debits − reinvestments
- Withdrawable applies 5-day lock period on principal/interest
- Referral earnings added to withdrawable

Acceptable difference: **0.00** for all migrated customers.

## Reports

Generated in `platform/migration-reports/`:
- `{runId}-validation.json`
- `{runId}-full.json`
- `{runId}-summary.txt`

## Known Legacy Data Issues

- **Orphan transactions**: ~330 txs reference emails not in `users` table (deleted accounts). Archived but not loaded to ledger.
- **Duplicate username**: `Salman26` appears twice — requires manual resolution before live import.
- **Empty email txs**: A few records have blank emails — skipped with warnings.

## Recovery

| Scenario | Action |
|----------|--------|
| Interrupted load | Re-run same phase — idempotency skips completed records |
| Wrong live import | POST `/api/admin/migration/{id}` with `{ "action": "rollback" }` |
| Partial phase failure | Check `migration_checkpoints` for cursor, re-run phase |

## Security

- API routes require `migration.run` permission (Super Admin only)
- Migration tables have RLS policies (admin-only)
- Legacy passwords are never stored or imported
