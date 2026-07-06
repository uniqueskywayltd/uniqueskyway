# Developer Guide — Unique Sky Way Platform

Technical reference for engineers working on the Next.js + Supabase fintech platform in `platform/`.

**Stack:** Next.js 16 (App Router), React 19, Drizzle ORM, Supabase (Auth, Postgres, Storage), Resend (email), Vercel (hosting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Browser / Vercel Cron                                      │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
        Customer UI                   Admin Console
    (app/, dashboard/)              (app/admin/)
                │                             │
                └──────────┬──────────────────┘
                           │
              Server Components + API Routes
              (app/api/*, Server Actions)
                           │
              ┌────────────┴────────────┐
              │   Service Layer         │
              │   lib/services/*        │
              └────────────┬────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    Supabase Auth    Postgres (Drizzle)   Supabase Storage
    (sessions)       (ledger, profiles)   (avatars, proofs)
                           │
                    Resend (email queue
                    via cron processor)
```

### Core Principles

1. **Ledger-only balances** — no balance columns; all money flows through `LedgerService.postEntry()`
2. **Service-backed UI** — pages and API routes delegate to services; no business logic in components
3. **Audited admin mutations** — every admin write calls `AuditService.log()`
4. **Feature flags vs settings** — booleans in `feature_flags`; scalars in `system_settings`
5. **Idempotent financial ops** — deposits, withdrawals, ROI, referrals use idempotency keys
6. **Infrastructure graceful degradation** — `guardDatabase()` returns friendly errors when DB unavailable

See `DECISIONS.md` for full ADR history (ADR-001 through ADR-041).

---

## Folder Structure

```
platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # Admin console (portal layout)
│   │   ├── dashboard/          # Customer dashboard
│   │   ├── api/                # API routes (cron, admin, customer)
│   │   └── (marketing pages)   # Public site
│   ├── components/             # React components (ui/, admin/, dashboard/)
│   ├── db/
│   │   └── schema/             # Drizzle schema modules
│   ├── emails/                 # React Email templates
│   ├── lib/
│   │   ├── auth/               # Session, guards, validation
│   │   ├── errors/             # AppError, handleApiError
│   │   ├── logging/            # Structured JSON logger
│   │   ├── migration/          # Legacy ETL (M9)
│   │   ├── monitoring/         # Diagnostics service
│   │   ├── permissions/        # RBAC constants
│   │   ├── security/           # Privacy shield, rate limiting
│   │   ├── services/           # Business logic (single source of truth)
│   │   └── supabase/           # Client factories (browser, server, admin)
│   └── types/                  # Shared TypeScript types
├── supabase/migrations/        # SQL migrations (0000–0013)
├── scripts/                    # CLI: seed, verify, bootstrap, migration
├── emails/                     # (templates live in src/emails/)
├── vercel.json                 # Cron schedules
├── .env.example
└── docs (*.md)
```

---

## Services

All services live in `src/lib/services/`. Export barrel: `src/lib/services/index.ts`.

### Financial Core

| Service | File | Responsibility |
|---------|------|----------------|
| `LedgerService` | `ledger.service.ts` | Immutable financial postings (only money path) |
| `WalletService` | `wallet.service.ts` | Derived balances: available, invested, pending, locked |
| `DepositService` | `deposit.service.ts` | Deposit lifecycle + approval → investment activation |
| `WithdrawalService` | `withdrawal.service.ts` | Withdrawal lifecycle + fund reservation |
| `TreasuryService` | `treasury.service.ts` | Payout queue and provider execution |
| `InvestmentEngine` | `investment-engine.service.ts` | Activation, ROI calc, maturity |
| `RoiSchedulerService` | `roi-scheduler.service.ts` | Daily accrual cron with idempotency |
| `ReinvestmentService` | `reinvestment.service.ts` | Customer reinvest from available balance |

### Admin & Operations

| Service | File |
|---------|------|
| `AdminDashboardService` | `admin-dashboard.service.ts` |
| `CustomerAdminService` | `customer-admin.service.ts` |
| `LedgerAdminService` | `ledger-admin.service.ts` |
| `InvestmentAdminService` | `investment-admin.service.ts` |
| `ReportingService` | `reporting.service.ts` |
| `ReferralAdminService` | `referral-admin.service.ts` |
| `AdminAuditService` | `admin-audit.service.ts` |
| `AdminSearchService` | `admin-search.service.ts` |

### Platform Infrastructure

| Service | File |
|---------|------|
| `NotificationService` | `notification.service.ts` |
| `NotificationProcessorService` | `notification-processor.service.ts` |
| `EmailService` | `email.service.ts` |
| `FeatureFlagService` | `feature-flags.service.ts` |
| `SettingsService` | `settings.service.ts` |
| `AuditService` | `audit.service.ts` |
| `PermissionService` | `permission.service.ts` |
| `SessionService` | `session.service.ts` |
| `RiskService` | `risk.service.ts` |

### Migration (M9)

| Service | File |
|---------|------|
| `MigrationOrchestratorService` | `migration/migration-orchestrator.service.ts` |
| `MigrationLoadService` | `migration/migration-load.service.ts` |
| `MigrationVerifyService` | `migration/migration-verify.service.ts` |
| `MigrationReportService` | `migration/migration-report.service.ts` |
| `MigrationImageService` | `migration/migration-image.service.ts` |

### Service Conventions

```typescript
// All services return ServiceResult<T>
type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

// Use ok() and fail() helpers from ./base
// Financial writes: always inside db.transaction()
// Ledger posts in parent tx: LedgerService.postEntryInTransaction(tx, input)
```

---

## Database

### ORM & Migrations

- **Schema:** Drizzle in `src/db/schema/`
- **Migrations:** `supabase/migrations/0000_initial_schema.sql` through `0013_migration_m9.sql`
- **Apply:** `npm run db:migrate`
- **Generate from schema changes:** `npm run db:generate` (review SQL before applying)

### Key Tables

| Domain | Tables |
|--------|--------|
| Users | `profiles`, `admin_users`, `login_history`, `user_sessions` |
| Auth/RBAC | `permissions`, `role_permissions` |
| Config | `feature_flags`, `system_settings` |
| Finance | `ledger_accounts`, `ledger_entries`, `deposit_requests`, `withdrawal_requests` |
| Investments | `investment_plans`, `investments`, `investment_events`, `roi_processing_runs` |
| Referrals | `referrals`, `referral_relationships`, `referral_commissions` |
| Notifications | `notifications`, `notification_events`, `notification_preferences` |
| Compliance | `audit_logs`, `risk_events` |
| Migration | `migration_runs`, `migration_checkpoints`, `migration_idempotency`, `legacy_transactions_archive` |

### Row Level Security

RLS is enabled on all application tables (`0002_rls_policies.sql`). Server-side code uses the Supabase service role for privileged operations; customer queries respect RLS via the anon key + session.

---

## Ledger

The ledger is append-only. Database triggers block `UPDATE` and `DELETE` on `ledger_entries`.

### Account Types

| Type | Purpose |
|------|---------|
| `available` | Withdrawable customer balance |
| `invested` | Locked in active investments |
| `pending_withdrawal` | Reserved during withdrawal approval |

### Entry Types (examples)

`investment_principal`, `investment_interest`, `withdrawal`, `referral_commission`, `reinvestment`, `admin_adjustment`, `roi_accrual`

### Posting Pattern

```typescript
await ledgerService.postEntryInTransaction(tx, {
  profileId,
  accountType: "available",
  direction: "credit",
  amount: "100.00",
  entryType: "roi_accrual",
  idempotencyKey: `roi-accrual-${investmentId}-${date}`,
  referenceType: "investment",
  referenceId: investmentId,
});
```

Pre-debit balance checks run at both application and database layers. Reversals are new entries, never updates.

---

## Scheduler (Cron)

Configured in `vercel.json`:

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `/api/cron/roi` | Daily 06:00 UTC | ROI accrual for active investments |
| `/api/cron/notifications` | Every 15 min | Process email queue + notification events |

### Authorization

Both endpoints require `CRON_SECRET`:

```
Authorization: Bearer <CRON_SECRET>
# or
?secret=<CRON_SECRET>
```

### ROI Scheduler

- Idempotency key: `roi-accrual-{investmentId}-{YYYY-MM-DD}`
- Logs to `roi_processing_runs`
- Supports dry-run mode for admin testing
- Uses `FOR UPDATE` row locks during accrual

### Notification Processor

- Processes `notification_events` (status: pending → completed/failed)
- Processes `notifications` where channel=email, status=pending
- Max 3 retry attempts per email notification
- Batch size: 25 per cron invocation

---

## Deployment

### Target: Vercel + Supabase

1. Connect Git repository to Vercel
2. Set root directory to `platform/`
3. Configure environment variables (see below)
4. Apply Supabase migrations to production project
5. Run `npm run bootstrap:admin` once for Super Admin
6. Verify `/api/health` returns `status: "ok"`

Full checklist: `DEPLOYMENT_CHECKLIST.md`

### Build Commands

```bash
npm run type-check   # TypeScript
npm run lint         # ESLint
npm run build        # Production build
```

---

## Environment Variables

Copy `.env.example` to `.env.local` for development.

| Variable | Required | Scope | Purpose |
|----------|----------|-------|---------|
| `NEXT_PUBLIC_APP_URL` | Yes | Client | Canonical app URL |
| `NEXT_PUBLIC_APP_NAME` | Yes | Client | Display name |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Prod | Server | Admin auth, storage, privileged DB |
| `DATABASE_URL` | Prod | Server | Postgres connection (pooler) |
| `RESEND_API_KEY` | Prod | Server | Transactional email |
| `EMAIL_FROM` | Prod | Server | Sender address |
| `CRON_SECRET` | Prod | Server | Cron endpoint auth |
| `SITE_ACCESS_KEY` | Prod* | Server | Pre-launch privacy gate |
| `MAINTENANCE_MODE` | No | Server | Emergency override (flag is primary) |

\*Required when site is in link-only pre-launch mode. See ADR-041.

Validation: `validateEnv()` in `src/lib/env.ts`. Integration status: `getIntegrationStatus()` in `src/lib/infrastructure.ts`.

---

## Email System

- **Provider:** Resend
- **Templates:** React Email in `src/emails/`
- **Service:** `EmailService` renders HTML + plain text
- **Delivery:** Async via `NotificationProcessorService` (not inline in request handlers)

Supported event types map through `EmailService.sendForEventType()`:

`deposit.submitted`, `deposit.approved`, `deposit.rejected`, `withdrawal.*`, `investment.activated`, `investment.roi_accrued`, `investment.matured`, `investment.reinvested`, `referral.commission`, `admin.broadcast`

Auth emails (welcome, verify, password reset) send directly from auth flows.

If `RESEND_API_KEY` is missing, emails are skipped with a structured log warning — in-app notifications still work.

---

## Logging & Errors

### Structured Logger

```typescript
import { logger } from "@/lib/logging/logger";

logger.info("financial", "Deposit approved", { depositId, profileId });
logger.error("email", "Send failed", { subject, to }, errorId);
```

Categories: `app`, `security`, `financial`, `scheduler`, `email`, `migration`, `admin`

Output: JSON lines to stdout (Vercel log drain compatible).

### AppError

API routes use `handleApiError()` which returns:

```json
{
  "error": "User-friendly message",
  "code": "VALIDATION_ERROR",
  "errorId": "err_a1b2c3",
  "retryable": false
}
```

Never expose stack traces or internal details to clients.

---

## Testing

### Quality Gates

```bash
npm run type-check
npm run lint
npm run build
npm run db:verify          # Infrastructure seed check
```

### Manual / E2E

Follow `TEST_PLAN.md` for full verification checklist.

### Migration Testing

```bash
npm run migration:dry-run              # Offline — no DB required
npm run migration -- --phase=all       # Dry run with DB
npm run migration -- --live            # Live import (cutover only)
```

### Local Development

```bash
cp .env.example .env.local
# Fill Supabase + DATABASE_URL
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Without `DATABASE_URL`, marketing pages work; dashboard and admin show infrastructure banners.

---

## Migration

Legacy ETL pipeline (M9) documented in `MIGRATION_GUIDE.md`.

**Key rules:**

- Legacy SQL dump is read-only source
- All financial data becomes ledger entries
- Idempotency keys: `legacy-m9:{entity}:{legacyId}`
- Passwords never imported — forced reset at cutover
- Super Admin only (`migration.run` permission)

CLI entry: `scripts/migration/run.ts`  
Admin UI: `/admin/migration`

---

## API Routes (Selected)

| Route | Auth | Purpose |
|-------|------|---------|
| `/api/health` | Public | Diagnostics report |
| `/api/cron/roi` | CRON_SECRET | Daily ROI |
| `/api/cron/notifications` | CRON_SECRET | Email queue |
| `/api/admin/*` | Admin RBAC | Admin operations |
| `/api/dashboard/*` | Customer session | Customer actions |
| `/api/settings/public` | Public | Non-sensitive settings |

Admin routes use `requireAdmin(permission)` from `src/lib/auth/api-guard.ts`.

---

## Troubleshooting

### Build fails on Vercel

1. Check `npm run build` locally
2. Verify all env vars set in Vercel project settings
3. Ensure `DATABASE_URL` uses Supabase **pooler** port 6543

### Cron not running

1. Confirm `vercel.json` crons deployed (Pro plan required for cron)
2. Verify `CRON_SECRET` matches Vercel env
3. Check Vercel → Cron Jobs logs
4. Manually trigger: `curl -H "Authorization: Bearer $CRON_SECRET" https://your-app/api/cron/roi`

### Emails stuck in pending

1. Check `RESEND_API_KEY` and domain verification in Resend dashboard
2. Hit `/api/cron/notifications` manually
3. Query `notifications` where `channel='email'` and `status='failed'`
4. Use `NotificationProcessorService.retryFailed()` or re-queue from admin

### INSUFFICIENT_FUNDS on ledger post

Balance derived from entries doesn't cover debit. Trace entries in `/admin/ledger` for the profile. Never bypass `LedgerService`.

### RLS permission denied

Server code doing privileged writes must use service role client or direct Drizzle with `DATABASE_URL`. Customer-facing queries use anon key + user session.

### Privacy shield blocking access

When `SITE_ACCESS_KEY` is set, users need `?access=KEY` once (sets cookie). Exempt: `/api/health`, `/robots.txt`.

---

## Related Documentation

| File | Purpose |
|------|---------|
| `DECISIONS.md` | Architecture decision records |
| `MILESTONE_REPORT.md` | Milestone delivery reports |
| `CLIENT_ADMIN_GUIDE.md` | Non-developer admin guide |
| `DEPLOYMENT_CHECKLIST.md` | Production launch checklist |
| `PRODUCTION_READINESS_REPORT.md` | M10 readiness assessment |
| `TEST_PLAN.md` | E2E verification |
| `MIGRATION_GUIDE.md` | Legacy ETL |
| `CUTOVER_PLAN.md` | Cutover sequence |
| `ROLLBACK_PLAN.md` | Emergency rollback |
