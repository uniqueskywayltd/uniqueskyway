# Production Cutover Plan — Unique Sky Way

## Pre-Cutover Checklist

- [ ] All M9 dry runs pass with **zero balance discrepancies**
- [ ] Duplicate username conflicts resolved
- [ ] Supabase production project linked and migrations 0000–0013 applied
- [ ] `CRON_SECRET`, `SITE_ACCESS_KEY`, Resend API configured
- [ ] DNS for `uniqueskyway.com` ready to point to Vercel
- [ ] Legacy platform placed in maintenance mode
- [ ] Customer communication email drafted (password reset required)

## Cutover Sequence

### T-7 days
1. Run final dry-run migration against production schema (empty DB)
2. Review all validation reports
3. Stakeholder sign-off on balance parity report

### T-1 day
1. Set legacy site to maintenance/read-only
2. Take final SQL dump snapshot (store securely)
3. Verify dump hash matches migration source file

### T-0 (Cutover Window)

| Step | Action | Owner | Duration |
|------|--------|-------|----------|
| 1 | Enable maintenance mode on new platform | Ops | 5 min |
| 2 | Run **live** migration (`dryRun: false`) | Super Admin | 15 min |
| 3 | Run verify phase — confirm 0 exceptions | Super Admin | 5 min |
| 4 | Spot-check 3 customer accounts manually | Finance | 15 min |
| 5 | Enable ROI cron (`/api/cron/roi`) | Ops | 5 min |
| 6 | Switch DNS to Vercel | Ops | 5–60 min |
| 7 | Send password reset emails to all customers | Ops | 30 min |
| 8 | Disable maintenance mode | Ops | 5 min |
| 9 | Monitor error logs and health endpoint | Ops | 2 hours |

### T+1 day
1. Compare first-day deposit/withdrawal counts
2. Review audit logs for anomalies
3. Keep legacy DB accessible (read-only) for 30 days

## Rollback Trigger Conditions

- Any balance discrepancy > $0.01 for migrated customers
- Auth/login failure rate > 10%
- Critical payment flow broken

See `ROLLBACK_PLAN.md` for rollback procedure.

## Post-Cutover

- Legacy PHP remains in repository (read-only reference)
- `legacy_transactions_archive` retained permanently
- Migration dashboard accessible for 90 days post-cutover
