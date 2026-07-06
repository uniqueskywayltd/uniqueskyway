# Deployment Checklist — Unique Sky Way

Use this checklist before every production deployment and mandatory before initial go-live. Check items in order; do not skip rollback preparation.

**Target:** Vercel (app) + Supabase (database, auth, storage) + Resend (email)

---

## 1. Infrastructure Preparation

### Supabase Project

- [ ] Production Supabase project created (separate from staging/dev)
- [ ] Postgres connection string copied (pooler, port **6543**)
- [ ] Anon key and service role key stored in secrets manager
- [ ] Auth email templates reviewed (Supabase handles auth emails only if configured; platform uses Resend for transactional)
- [ ] Email confirmation redirect URLs include production domain

### Vercel Project

- [ ] Repository connected; root directory set to `platform/`
- [ ] Production domain configured (`uniqueskyway.com`, `www` redirect if applicable)
- [ ] Vercel Pro plan active (required for cron jobs)
- [ ] Build command: `npm run build`
- [ ] Node.js version matches local development (20.x)

### Resend

- [ ] Production domain verified (`uniqueskyway.com`)
- [ ] SPF/DKIM/DMARC DNS records published
- [ ] `EMAIL_FROM` address authorized in Resend
- [ ] Test send from Resend dashboard succeeds

### DNS

- [ ] A/CNAME records point to Vercel
- [ ] SSL certificate provisioned (automatic via Vercel)
- [ ] Legacy domain redirect plan documented (if applicable)

---

## 2. Environment Variables

Set all variables in Vercel **Production** environment:

| Variable | Set | Verified |
|----------|-----|----------|
| `NEXT_PUBLIC_APP_URL` | [ ] | [ ] `https://uniqueskyway.com` |
| `NEXT_PUBLIC_APP_NAME` | [ ] | [ ] |
| `NEXT_PUBLIC_SUPABASE_URL` | [ ] | [ ] |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | [ ] | [ ] |
| `SUPABASE_SERVICE_ROLE_KEY` | [ ] | [ ] Server-only |
| `DATABASE_URL` | [ ] | [ ] Pooler URL |
| `RESEND_API_KEY` | [ ] | [ ] |
| `EMAIL_FROM` | [ ] | [ ] |
| `CRON_SECRET` | [ ] | [ ] `openssl rand -hex 32` |
| `SITE_ACCESS_KEY` | [ ] | [ ] Pre-launch only |
| `MAINTENANCE_MODE` | [ ] | [ ] `false` at go-live |

**Security checks:**

- [ ] No secrets committed to git
- [ ] Service role key never exposed to client bundle
- [ ] `CRON_SECRET` differs between staging and production
- [ ] `SITE_ACCESS_KEY` rotated from any shared preview links

---

## 3. Database Migrations

```bash
# From local machine with production DATABASE_URL (read-only verify first)
npm run db:migrate
```

- [ ] Migrations `0000` through `0013` applied successfully
- [ ] No pending Drizzle migrations uncommitted in repo
- [ ] `npm run db:verify` passes against production
- [ ] RLS policies active on all tables
- [ ] Ledger immutability triggers present (`0001_ledger_functions.sql`)

**Post-migration seed check:**

- [ ] Feature flags seeded (6 flags, disabled by default)
- [ ] System settings seeded
- [ ] Permissions and role mappings seeded
- [ ] Investment plans present (Silver/Gold/Classic/Master from `0011`)

---

## 4. Storage Buckets

Verify in Supabase Storage dashboard:

| Bucket | Purpose | Policies |
|--------|---------|----------|
| `avatars` | Profile images | User-scoped upload/read |
| `documents` | KYC documents | User-scoped |
| `payment-proofs` | Deposit proof uploads | User-scoped |
| `legacy-imports` | Migration artifacts | Admin-only |

- [ ] All buckets created (`0003_storage.sql`)
- [ ] RLS policies applied
- [ ] Test avatar upload from customer dashboard
- [ ] Test payment proof upload on deposit flow

---

## 5. Feature Flags

Before go-live, confirm flag states in `/admin/feature-flags` or database:

| Flag | Pre-launch | Go-live |
|------|------------|---------|
| `registrations_enabled` | `false` | Enable when ready |
| `deposits_enabled` | `false` | Enable after treasury ready |
| `withdrawals_enabled` | `false` | Enable after treasury ready |
| `investments_enabled` | `false` | Enable with deposits |
| `referrals_enabled` | `false` | Enable when referral rules confirmed |
| `maintenance_mode` | `true` during deploy | `false` at cutover |

- [ ] All flags reviewed with finance stakeholder
- [ ] Maintenance mode enabled during deployment window
- [ ] Flag changes tested in staging first

---

## 6. Admin Bootstrap

```bash
npm run bootstrap:admin -- \
  --email=admin@uniqueskyway.com \
  --password="<strong-password>" \
  --name="Super Admin"
```

- [ ] Super Admin account created (one-time; bootstrap locks after completion)
- [ ] Super Admin can log in at `/admin`
- [ ] Additional admin users created with appropriate roles (not via bootstrap)
- [ ] Bootstrap completion flag set in `system_settings`
- [ ] Admin passwords stored in team password manager

---

## 7. Cron Jobs

Verify `vercel.json` crons deployed:

| Job | Path | Schedule |
|-----|------|----------|
| ROI accrual | `/api/cron/roi` | `0 6 * * *` (06:00 UTC daily) |
| Notifications | `/api/cron/notifications` | `0 7 * * *` on Vercel Hobby (RC1); restore `*/15 * * * *` on Pro at launch |

- [ ] Crons visible in Vercel dashboard
- [ ] Manual trigger succeeds:

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  https://uniqueskyway.com/api/cron/roi

curl -s -H "Authorization: Bearer $CRON_SECRET" \
  https://uniqueskyway.com/api/cron/notifications
```

- [ ] ROI dry-run tested in staging before first production accrual
- [ ] Timezone alignment confirmed (platform timezone in system settings)

---

## 8. Health Verification

```bash
curl -s https://uniqueskyway.com/api/health | jq .
```

Expected production response:

- [ ] `status`: `"ok"` (not `"degraded"` or `"down"`)
- [ ] `integrations.supabase`: `true`
- [ ] `integrations.database`: `true`
- [ ] `integrations.email`: `true`
- [ ] `integrations.storage`: `true`
- [ ] `integrations.missing`: `[]`
- [ ] `queues.pendingEmailNotifications`: low or `0`
- [ ] `scheduler.lastRoiRun`: present after first cron (may be null pre-first-run)

Admin dashboard system health widget should show all green.

---

## 9. Smoke Tests

Run critical path tests immediately after deploy. Full suite: `TEST_PLAN.md`.

### Auth

- [ ] Admin login succeeds
- [ ] Customer registration blocked/enabled per flag
- [ ] Password reset email received (Resend)

### Customer Flow (staging account)

- [ ] Dashboard loads with wallet balances
- [ ] Deposit submission (if enabled)
- [ ] Withdrawal submission (if enabled)
- [ ] In-app notification appears

### Admin Flow

- [ ] Dashboard KPIs load
- [ ] Deposit approve/reject works
- [ ] Withdrawal approve → treasury complete works
- [ ] Audit log records actions

### Email

- [ ] Transactional email delivered within 15 minutes (cron cycle)
- [ ] Email renders correctly on mobile and desktop clients

### Privacy (pre-launch)

- [ ] Site blocked without `?access=KEY` when `SITE_ACCESS_KEY` set
- [ ] Access cookie persists after first visit
- [ ] `/robots.txt` returns disallow rules
- [ ] Crawler user-agents receive 403

---

## 10. Migration (Cutover Only)

Skip for routine deploys. Required for legacy cutover — see `CUTOVER_PLAN.md`.

- [ ] Final dry-run migration: **zero balance discrepancies**
- [ ] Duplicate username conflicts resolved
- [ ] Legacy platform in maintenance/read-only
- [ ] Live migration executed by Super Admin
- [ ] Verify phase passes
- [ ] Spot-check 3+ customer accounts manually
- [ ] Password reset communication sent to all migrated users

---

## 11. Rollback Checkpoints

Document before enabling live traffic:

| Checkpoint | Rollback action |
|------------|-----------------|
| **Pre-DNS** | Redeploy previous Vercel deployment; no customer impact |
| **Post-migration, pre-DNS** | Run migration rollback via `/admin/migration` |
| **Post-DNS, pre-flags** | Enable maintenance mode; revert DNS; see `ROLLBACK_PLAN.md` |
| **Post-go-live** | Maintenance mode + manual treasury hold; DNS revert if critical |

- [ ] Previous Vercel deployment ID recorded
- [ ] Database backup taken immediately before migration
- [ ] Rollback owner assigned and reachable
- [ ] `ROLLBACK_PLAN.md` reviewed by ops team

---

## 12. Post-Deploy Monitoring (First 24 Hours)

- [ ] Monitor Vercel function logs for `error` level JSON entries
- [ ] Watch `/api/health` every 15 minutes (automated or manual)
- [ ] Check failed email count in admin notifications
- [ ] Verify first ROI cron run (if scheduled within 24h)
- [ ] Review audit log for unexpected admin activity
- [ ] Confirm no balance discrepancy reports from finance

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineering | | | |
| Operations | | | |
| Finance | | | |
| Super Admin | | | |

**Deployment version/tag:** _______________  
**Deployment timestamp (UTC):** _______________

---

## Related Documents

- `DEVELOPER_GUIDE.md` — technical reference
- `TEST_PLAN.md` — full E2E checklist
- `PRODUCTION_READINESS_REPORT.md` — readiness assessment
- `CUTOVER_PLAN.md` — legacy cutover sequence
- `ROLLBACK_PLAN.md` — emergency procedures
