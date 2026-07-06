# Changelog — Unique Sky Way Platform

All notable changes to the `platform/` application are documented here.

## [1.0.0] — Final Milestone (July 2026)

### Added

- **Final handover package** — `FINAL_HANDOVER.md`, `RELEASE_NOTES_v1.0.md`, `STAGING_SIGNOFF.md`, `KNOWN_LIMITATIONS.md`, `OPEN_ITEMS.md`
- **API documentation** — `API_DOCUMENTATION.md` (54 REST endpoints)
- **Architecture diagrams** — `ARCHITECTURE.md` (Mermaid)
- **Project README** — replaced create-next-app boilerplate

### Changed

- **Production cleanup** — removed unused imports (lint 0 warnings); wallet export aria-label cleaned
- **Logo assets** — re-exported `light-logo.webp` and `dark-logo.webp` with correct transparency
- **Marketing hero** — restored split layout with `financial-planning.jpg`; fixed testimonial/plan background images

### Validated

- Quality gates: type-check, lint, build — all pass
- Migration dry-run: balance parity pass; 1 username blocker documented
- Security code review: RLS, RBAC, rate limiting, cron auth — pass
- Performance: bundle sizes acceptable for v1.0 launch

### Not Performed (Per Instruction)

- No git commits, pushes, or pull requests
- No production or staging deployment
- Live staging validation pending client credentials

## [Unreleased] — Milestone 10

### Added

- **Transactional email system** — Resend + React Email with 15+ templates (auth, deposits, withdrawals, investments, referrals, broadcast)
- **EmailService** — centralized send path with HTML + plain text rendering and graceful degradation
- **Notification processor** — async email queue via `NotificationProcessorService`
- **Notification cron** — `/api/cron/notifications` every 15 minutes (batch 25, max 3 retries)
- **Structured JSON logger** — categorized logging (`app`, `security`, `financial`, `scheduler`, `email`, `migration`, `admin`)
- **AppError contract** — typed error codes, user-safe messages, unique `errorId`, `handleApiError()` helper
- **Enhanced health endpoint** — diagnostics report with integration status, queue depths, scheduler/migration state
- **DiagnosticsService** — production readiness monitoring foundation
- **Documentation pack** — `CLIENT_ADMIN_GUIDE.md`, `DEVELOPER_GUIDE.md`, `DEPLOYMENT_CHECKLIST.md`, `PRODUCTION_READINESS_REPORT.md`, `TEST_PLAN.md`
- **Production env notes** — `.env.example` updated with `SITE_ACCESS_KEY`, `CRON_SECRET`, Resend guidance

### Email Templates

- Auth: welcome, verify, password reset/changed, login alert, new device
- Financial: deposit submitted/approved/rejected, withdrawal submitted/approved/completed/rejected
- Investment: activated, daily ROI, matured, reinvested
- Referral commission, admin broadcast

### Cron Schedule (`vercel.json`)

- `/api/cron/roi` — daily 06:00 UTC (unchanged)
- `/api/cron/notifications` — every 15 minutes (new)

### Documentation

- M10 section in `MILESTONE_REPORT.md`
- ADR-038 through ADR-041 in `DECISIONS.md`

## [Unreleased] — Milestone 9

### Added

- **Legacy ETL pipeline** — 6-phase extract/validate/transform/load/verify/report
- **SQL dump parser** — reads immutable legacy MariaDB dump without DB connection
- **Legacy balance calculator** — replicates dashboard.php formulas for verification
- **Migration orchestrator** — dry-run, resume, rollback, idempotency throughout
- **User migration** — Supabase Auth with forced password reset (no plaintext import)
- **Ledger reconstruction** — all financial events as immutable ledger entries
- **Investment migration** — Credit/Reinvest txs mapped to plans + positions
- **Referral migration** — graph validation (circular, orphan, self-referral detection)
- **Image migration** — profile avatars from `u_images/` to Supabase Storage
- **Balance verification engine** — per-customer legacy vs ledger parity (0.00 tolerance)
- **Migration dashboard** — `/admin/migration` (Super Admin only)
- **Migration CLI** — `npm run migration:dry-run`, `npm run migration`
- **Migration `0013_migration_m9.sql`** — runs, checkpoints, idempotency, reports, exceptions
- **Documentation** — `MIGRATION_GUIDE.md`, `CUTOVER_PLAN.md`, `ROLLBACK_PLAN.md`

### Security

- `migration.run` permission restricted to Super Admin
- Migration API routes use `requireSuperAdmin()`
- Legacy passwords never stored or imported

## [Unreleased] — Milestone 8

### Added

- **Executive dashboard** — users, AUM, queues, revenue, ROI status, system health
- **Customer management** — search, detail, suspend, lock, notes, password reset workflow
- **Admin sidebar navigation** — organized operational control center
- **Financial operations hub** — `/admin/operations` linking all financial modules
- **Ledger explorer** — search entries, restricted manual corrections with audit
- **Investment plan admin** — activate, deactivate, duplicate, reorder
- **Payment method admin** — toggle status, manage configuration
- **Feature flag console** — enable/disable with audit trail
- **System settings console** — full platform configuration
- **Notification broadcast** — in-app broadcast to all customers
- **Audit center** — searchable immutable audit logs
- **Risk center** — operational insights without auto-blocking
- **Reporting services** — daily activity, referral, investment, ROI run history
- **Global admin search** — users, deposits, investments, ledger, audit
- **Migration `0012_admin_platform_m8.sql`** — customer notes, login_disabled

### Services

- `AdminDashboardService`, `CustomerAdminService`, `AdminAuditService`, `AdminSearchService`
- `ReportingService`, `ReferralAdminService`, `LedgerAdminService`
- Extended: `SettingsService`, `FeatureFlagService`, `PaymentMethodService`, `InvestmentPlanService`, `RiskService`, `NotificationService`

### Security

- All admin routes protected by RBAC via `requireAdmin(permission)`
- Every mutation audited via `AuditService.log()`
- Manual ledger corrections require reason + `LEDGER_ADJUST` permission
- Customer actions require `USERS_WRITE` with audit metadata

## [Previous] — Milestone 7

### Added

- **Investment engine** — activation, ROI calculation, maturity, pause/resume, force maturity
- **ROI scheduler** — daily/single/dry-run/recovery modes with processing logs
- **Reinvestment workflow** — customer reinvest from available balance
- **Referral commissions** — idempotent payout on investment activation
- **Investment timeline** — `investment_events` table and customer/admin views
- **Admin investment module** — `/admin/investments`, detail, pause, mature, manual adjust
- **ROI preview** — service-driven earnings, progress, next accrual on portfolio detail
- **Cron endpoint** — `/api/cron/roi` with Vercel Cron config
- **Migration `0011_investment_engine_m7.sql`** — plans extension, ROI runs, events, plan seeds

### Services

- `InvestmentEngine`, `RoiSchedulerService`, `ReinvestmentService`, `InvestmentAdminService`, `InvestmentEventService`
- `DepositService.approveDeposit()` refactored to delegate activation to engine
- `InvestmentPlanService.listVisible()` for marketing pages

### Financial Integrity

- Idempotent ROI accrual per investment per date
- Idempotent referral commissions per investment
- Ledger-only balance changes; no page-load ROI
- Transactional accrual with `FOR UPDATE` row locks
- Matured investments never continue earning

### APIs

- `/api/cron/roi`, `/api/admin/investments`, `/api/admin/investments/[id]`, `/api/dashboard/reinvest`

## [Previous] — Milestone 6

### Added

- **Withdrawal workflow** — multi-step customer form, submission, cancellation, status tracking
- **Withdrawal approval** — atomic admin approve/reject/request-info with fund reservation
- **Treasury operations** — payout queue, processing lifecycle, provider abstraction
- **Withdrawal methods** — configurable `withdrawal_methods` table (USDT TRC20, BTC, ETH, bank)
- **Risk event foundation** — `risk_events` table with evaluation on submission (no auto-block)
- **Admin treasury dashboard** — `/admin/treasury` with queue, volume, processing metrics
- **Admin withdrawal review** — `/admin/withdrawals/[id]` with balance impact, risk indicators
- **Customer withdrawal history** — `/dashboard/withdrawals` with filters and pagination
- **Migration `0010_withdrawals_m6.sql`** — withdrawal methods, treasury payouts, risk events

### Services

- `WithdrawalService` — full withdrawal lifecycle with validation and atomic approval
- `WithdrawalMethodService`, `TreasuryService`, `RiskService`
- `WalletService` — reserved balance, withdrawable balance, locked investments
- `PayoutProvider` abstraction with `ManualPayoutProvider`

### Financial Integrity

- Reservation model: available → pending_withdrawal → completed outflow
- Reversal entries on rejection after approval
- Idempotency keys on withdrawals and ledger entries
- `FOR UPDATE` lock prevents double approval
- Daily withdrawal limit and duplicate open-request protection

### APIs

- `/api/dashboard/withdrawals`, `/api/admin/withdrawals`, `/api/admin/treasury`, `/api/withdrawal-methods`

## [Previous] — Milestone 5

### Added

- **Deposit workflow** — multi-step customer form, submission, proof upload, status tracking
- **Deposit approval** — atomic admin approve/reject/request-info with investment creation
- **Payment methods** — configurable `payment_methods` table (crypto, bank transfer, manual)
- **Investment creation on approval** — automatic with ledger entries (deposit + principal lock)
- **Admin deposit queue** — search, review, approve, reject at `/admin/deposits`
- **Admin dashboard** — pending count, daily volume, quick approval queue
- **Customer deposit history** — `/dashboard/deposits` with filters and pagination
- **Investment detail page** — `/dashboard/portfolio/[id]` with linked deposit and ledger count
- **Migration `0009_deposits_m5.sql`** — payment methods, extended deposit status, proof storage

### Services

- `DepositService` — full deposit lifecycle with validation and atomic approval
- `PaymentMethodService`, `InvestmentPlanService`
- `LedgerService.postEntryInTransaction()` — transactional ledger posts
- `requireAdmin()` API guard with RBAC permissions

### Financial Integrity

- Database transactions for approval (investment + 3 ledger entries)
- Idempotency keys on deposits and ledger entries
- Duplicate reference ID prevention
- `FOR UPDATE` lock prevents double approval

### APIs

- `/api/dashboard/deposits`, `/api/admin/deposits`, `/api/payment-methods`, `/api/investment-plans`

## [Previous] — Milestone 4

### Added

- **Customer dashboard** — portfolio summary, 12 financial metrics, charts, recent activity, quick actions
- **Wallet module** — available/locked/pending balances, credits/debits, ledger preview
- **Ledger explorer** — filtering, search, pagination, immutable transaction details drawer
- **Profile management** — address fields, avatar upload (Supabase Storage), timezone, notification preferences
- **Security center** — login history, sessions, password change, security recommendations
- **In-app notifications** — read, unread, archive, mark all as read, pagination
- **Activity timeline** — unified audit + login history feed
- **Dashboard API suite** — `/api/dashboard/*` thin handlers backed by services
- **Migration `0007_dashboard_profile.sql`** — profile address fields, notification archive

### Services

- `DashboardService`, `ActivityService`, `SecurityService` (new)
- `WalletService` — expanded with summary, history, balance charts
- `NotificationService` — list, read, archive, mark-all-read
- `ProfileService` — update profile, preferences, avatar path

### Pages

- `/dashboard` — full investor overview with Recharts
- `/dashboard/wallet`, `/dashboard/ledger`, `/dashboard/notifications`, `/dashboard/activity`
- Expanded `/dashboard/profile`, `/dashboard/security`

### Added

- **Portfolio module** — `/dashboard/portfolio` with positions, ROI, allocation
- **Expanded wallet metrics** — pending balance, total deposits/withdrawals, ROI earned
- **Graceful infrastructure handling** — `ConfigStatusBanner`, `ServiceErrorState`, `guardDatabase()`
- **Enhanced health endpoint** — reports supabase, database, storage, email status
- **Activity timeline via AuditService** — `getTimelineForProfile()`
- **Preferred currency** — `profile_preferences.preferred_currency` (migration `0008`)
- **Ledger filters** — reference ID, status, date range
- **Chart states** — loading, error, empty for all dashboard charts

### Architecture

- `PortfolioService` (new), `infrastructure-guard.ts`, `getIntegrationStatus()`
- Services return `INFRASTRUCTURE_NOT_CONFIGURED` instead of throwing
- Avatar uploads disabled when storage not configured

## [Previous] — Milestone 3

### Added

- **Supabase Auth integration** — registration, login, logout, email verification, password reset/change
- **Profile provisioning** — automatic profile, preferences, notification settings, ledger account on register
- **Referral registration** — `/register?ref=username` with relationship recording (no commissions)
- **Session management** — device/browser/OS tracking, revoke individual/all sessions
- **Login history + audit logging** on all auth events
- **Brute-force protection** — `auth_lockouts` table, 5-attempt lockout
- **Admin authentication** — separate `/admin/login` with RBAC
- **Super admin bootstrap** — `npm run bootstrap:admin` (one-time)
- **React Email templates** — welcome, verify, reset, password changed, login alerts
- **Auth middleware** — route protection, maintenance mode, email verification gate
- **Migration `0006_auth_identity.sql`** — preferences, lockouts, session metadata

### Pages

- `/check-email`, `/verify-email`, `/reset-password`, `/maintenance`
- `/dashboard`, `/dashboard/profile`, `/dashboard/security`
- `/admin`, `/admin/login`

### API

- Full `/api/auth/*` route suite (register, login, logout, password, sessions, admin)

## [Previous] — Milestone 2

### Added

- **Database schema** — 20 tables: profiles, admin_users, login_history, user_sessions, permissions, role_permissions, feature_flags, system_settings, ledger_accounts, ledger_entries, deposit_requests, withdrawal_requests, investment_plans, investments, referrals, notifications, notification_events, audit_logs, legacy_transactions_archive
- **SQL migrations** (`0000`–`0005`):
  - `0000_initial_schema.sql` — Drizzle-generated DDL with indexes and foreign keys
  - `0001_ledger_functions.sql` — Immutable ledger, balance functions, views, debit checks
  - `0002_rls_policies.sql` — Row Level Security on all tables
  - `0003_storage.sql` — Avatars, documents, legacy-imports buckets with policies
  - `0004_seed_system.sql` — Feature flags, settings, permissions, role mappings (no plans)
  - `0005_extended_settings.sql` — Company phone/address, timezone, referral %, deposit limits
- **Services** — LedgerService, WalletService, AuditService, NotificationService, FeatureFlagService, SettingsService, PermissionService, SessionService
- **Security** — Rate limiting architecture, request context extraction, maintenance mode helpers
- **Auth infrastructure** — Supabase SSR clients, middleware session refresh, `getAuthUser()` helper
- **API routes** — `/api/health`, `/api/settings/public`
- **Scripts** — `db:seed`, `db:verify`, `db:migrate`, `db:generate`
- **Documentation** — DECISIONS.md, MILESTONE_REPORT.md, CHANGELOG.md

### Security

- RLS enabled on all 20 application tables
- Ledger entries are append-only (database triggers block UPDATE/DELETE)
- Pre-debit balance validation at database and application layers
- Storage policies enforce user-scoped access
- Login history and session tracking foundation

### Configuration

- 6 feature flags (all disabled at launch)
- 16 system settings (business values null until legacy validation)
- 30 granular permissions across 6 admin roles
- `investment_plans` intentionally empty

### Not Changed

- Legacy PHP application (read-only)
- No data migration
- No customer-facing financial operations wired yet

## [Previous] — Milestone 1 + Visual Phase

### Added

- Next.js 16 scaffold with TypeScript, Tailwind 4, shadcn/ui
- Marketing pages: home, about, services, investments, how-it-works, security, referrals, contact, FAQ, privacy, terms
- Auth UI placeholders: login, register, forgot-password
- Brand imagery from legacy asset library
- Design system components
