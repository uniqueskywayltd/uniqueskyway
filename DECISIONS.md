# Architectural Decisions — Unique Sky Way Platform

## ADR-001: Ledger-Based Financial Model

**Decision:** All wallet balances are derived from immutable `ledger_entries`. No balance column exists on any table.

**Rationale:** Legacy PHP computed balances via scattered SQL on a mutable `transactions` table, causing inconsistency risk. An append-only ledger with database-level immutability triggers ensures auditability and prevents silent balance corruption.

**Implications:**
- `LedgerService.postEntry()` is the only application path for financial movements
- All posts run inside database transactions with pre-debit balance checks
- `get_ledger_account_balance()` SQL function and views provide read access
- Reversals are new entries, never updates

---

## ADR-002: No Investment Plan Seeding (M2)

**Decision:** `investment_plans` table remains empty until legacy business rules are validated.

**Rationale:** Legacy platform has inconsistencies between marketing copy, ROI percentages, plan names, durations, lock periods, and the actual ROI cron calculations.

**Implications:**
- `investments_enabled` feature flag stays `false` at launch
- `LEGACY_PLAN_REFERENCE` in code is documentation-only, not for seeding
- M3+ migration engine must validate rules before populating plans

---

## ADR-003: Feature Flags vs System Settings

**Decision:** Operational toggles (registrations, deposits, withdrawals, investments, referrals, maintenance) are feature flags. Configurable business values (company info, limits, referral percentage, timezone) are system settings.

**Rationale:** Flags are boolean on/off switches managed independently from scalar configuration values. Separating concerns allows admins to toggle features without touching business parameters.

---

## ADR-004: Drizzle ORM over Prisma

**Decision:** Use Drizzle ORM with SQL migrations in `supabase/migrations/`.

**Rationale:** Direct SQL control for RLS policies, triggers, functions, and views. Drizzle schema serves as TypeScript types; migrations are the source of truth for production DDL.

---

## ADR-005: Supabase for Auth + Storage + Postgres

**Decision:** Supabase provides authentication, row-level security, and storage buckets. Application logic runs in Next.js with service-role access for privileged operations.

**Rationale:** Enterprise auth (sessions, MFA-ready), built-in RLS integration, and managed Postgres reduce infrastructure overhead while maintaining security boundaries.

---

## ADR-006: RBAC with Six Admin Roles

**Decision:** Six roles with granular permissions via `permissions` + `role_permissions` tables.

| Role | Purpose |
|------|---------|
| `super_admin` | Full access |
| `administrator` | Day-to-day operations |
| `finance_manager` | Deposits, withdrawals, ledger |
| `compliance_officer` | Audit, compliance reviews |
| `support_agent` | Customer support |
| `auditor` | Read-only audit access |

**Rationale:** Even if only super_admin is used initially, the permission matrix prevents retrofitting authorization later.

---

## ADR-007: Legacy PHP Remains Read-Only

**Decision:** The legacy PHP application in the repository root is not modified. It serves as the source of truth for migration validation only.

**Rationale:** Parallel systems during transition; changes to legacy could invalidate migration assumptions.

---

## ADR-008: Rate Limiting — In-Memory with Redis Migration Path

**Decision:** M2 implements in-memory rate limiting (`src/lib/security/rate-limit.ts`). Production multi-instance deployments should migrate to Redis/Upstash.

**Rationale:** Provides architectural foundation without adding infrastructure dependencies in M2. Single-instance Vercel deployments benefit immediately.

---

## ADR-009: Accrued Interest on Investments

**Decision:** `investments.accrued_interest` tracks position-level interest accrual, not wallet balance.

**Rationale:** Investment positions need accrual tracking separate from the ledger. Wallet balances remain ledger-derived only. Accrual is reconciled to ledger entries at payout/maturity.

---

## ADR-010: Notification Event Queue

**Decision:** Notifications use an event-emission pattern (`notification_events` table) with async processing in later milestones.

**Rationale:** Decouples business logic from delivery channels (email, SMS, push). Idempotency keys prevent duplicate processing.

---

## ADR-011: Compensating Transactions for Registration

**Decision:** Registration creates Supabase Auth user first, then runs a Drizzle DB transaction. On DB failure, the Auth user is deleted via admin client.

**Rationale:** Supabase Auth is external to Postgres transactions. Compensating delete ensures no orphaned auth accounts without profiles.

---

## ADR-012: Separate Admin Authentication Path

**Decision:** Admins use `/api/auth/admin/login` and `admin_users` table. Customer login rejects non-admin auth users for admin routes.

**Rationale:** Complete separation of customer and operator identity. RBAC enforced via `admin_users.role` + `role_permissions`.

---

## ADR-013: No Email Enumeration

**Decision:** Login, forgot-password, and resend-verification always return generic messages regardless of whether the email exists.

**Rationale:** Prevents attackers from discovering valid accounts.

---

## ADR-014: Email Verification Gate

**Decision:** Middleware blocks `/dashboard/*` until `email_confirmed_at` or `profiles.email_verified` is true.

**Rationale:** No customer dashboard access before identity verification.

---

## ADR-015: Service-Backed Dashboard (No UI Queries)

**Decision:** Dashboard pages and API routes call services only. React components never query database tables directly and never compute balances.

**Rationale:** Single source of truth prevents drift between API and UI. Financial integrity depends on ledger-only balance derivation.

**Implications:**
- `WalletService` is the only path for balance reads
- `DashboardService` aggregates portfolio metrics from wallet + investment counts
- UI uses `formatMoney()` for display formatting only

---

## ADR-016: Server-First Dashboard Data Loading

**Decision:** Dashboard pages load data in Server Components via services. Client components handle interactivity only (charts, forms, drawers).

**Rationale:** Reduces client bundle, eliminates fetch waterfalls, improves SEO and time-to-first-byte for authenticated views.

**Implications:**
- API routes exist for client mutations (profile update, notification actions) and future mobile clients
- Pagination on ledger/notifications uses URL search params + server re-render

---

## ADR-017: Avatar Storage via Supabase

**Decision:** Profile photos upload to the `avatars` storage bucket via admin client. Serving uses signed URLs through `/api/storage/avatars/[...path]` with ownership validation.

**Rationale:** User-scoped paths (`{authUserId}/avatar.ext`), server-side validation, no public bucket exposure.

---

## ADR-018: Activity Timeline from Audit Logs

**Decision:** `AuditService.getTimelineForProfile()` is the source of truth for the activity timeline. Login, profile, security, deposit, withdrawal, investment, and admin actions are recorded as audit log entries.

**Rationale:** Reuses M2/M3 audit infrastructure without a duplicate activity table.

---

## ADR-019: Graceful Infrastructure Degradation

**Decision:** Services use `guardDatabase()` and return `INFRASTRUCTURE_NOT_CONFIGURED` instead of throwing when `DATABASE_URL` is missing. UI shows `ConfigStatusBanner` and `ServiceErrorState`; affected features disable individually.

**Rationale:** Development and staging environments may lack full credentials. The app must never crash on missing env vars.

**Implications:**
- `getDbSafe()` for optional session reads
- `/api/health` reports integration status
- Avatar uploads gated by `isStorageConfigured()`
- API routes return 503 for infrastructure errors

---

## ADR-020: Deposit-Triggered Investment Creation

**Decision:** Investments are created exclusively through approved deposits. The `DepositService.approveDeposit()` method runs investment creation and ledger posting in a single database transaction.

**Rationale:** No manual investment creation; every investment has a funded deposit trail. Financial integrity requires atomic approval.

**Implications:**
- `investments.deposit_request_id` links position to source deposit
- `LedgerService.postEntryInTransaction()` participates in parent transactions
- Approval is idempotent via status check + `FOR UPDATE` lock

---

## ADR-021: Configurable Payment Methods

**Decision:** Payment methods are stored in `payment_methods` table, not hardcoded. Application code references methods by slug.

**Rationale:** Supports cryptocurrency, bank transfer, manual, and future gateway types without code changes.

**Implications:**
- Migration seeds initial methods; admin can add/modify via DB
- `requires_proof`, min/max amounts configurable per method

---

## ADR-022: Withdrawal Reservation Ledger Model

**Decision:** Withdrawal approval reserves funds by debiting `available` and crediting `pending_withdrawal`. Completion debits `pending_withdrawal` as the final outflow. Rejection after approval posts reversal entries.

**Rationale:** Mirrors deposit pending model; funds never disappear; every state transition has ledger representation; supports audit and balance reconciliation.

**Implications:**
- `pending_withdrawal` account type serves as reserved balance
- No ledger activity on submission (validation only)
- `WalletService.reservedBalance` maps to `pending_withdrawal` ledger account

---

## ADR-023: Treasury Provider Abstraction

**Decision:** Payout execution is isolated behind a `PayoutProvider` interface. M6 ships with `ManualPayoutProvider`; future automated providers register in `payoutProviders` without changing withdrawal business logic.

**Rationale:** Supports manual operations today and pluggable crypto/bank API integrations later.

**Implications:**
- `treasury_payouts` table tracks queue independently of provider
- `TreasuryService` manages payout lifecycle; providers handle execution only

---

## ADR-024: Risk Events Without Auto-Block

**Decision:** `RiskService` records risk events on withdrawal submission but does not block requests automatically.

**Rationale:** Compliance rules require human review; foundation enables future automated rules without changing submission flow.

**Implications:**
- `risk_events` table with severity and metadata
- Admin review UI displays risk indicators
- Future milestone can add blocking rules on top of recorded events

---

## ADR-025: Configurable Withdrawal Methods

**Decision:** Withdrawal methods are stored in `withdrawal_methods` table, separate from deposit payment methods.

**Rationale:** Withdrawal destinations (wallet addresses, bank details) differ from deposit proof requirements; independent configuration per direction.

**Implications:**
- Migration seeds USDT TRC20, Bitcoin, Ethereum, Bank Transfer
- `destination_details` JSONB on withdrawal requests stores method-specific fields

---

## ADR-026: Configurable Investment Engine

**Decision:** All investment lifecycle operations (activation, ROI accrual, maturity, referral commission) are handled by a dedicated `InvestmentEngine` service. Page requests never mutate balances or accrue ROI.

**Rationale:** Legacy PHP accrued ROI on page load — non-idempotent, non-auditable, and unsafe under concurrent requests. A scheduled engine with ledger idempotency keys reproduces legacy behavior once validated while enabling admin control.

**Implications:**
- `InvestmentEngine.activateInvestmentInTransaction()` used by deposit approval and reinvestment
- ROI preview is read-only via `calculateRoiPreview()`
- Matured investments excluded from accrual via status check

---

## ADR-027: Idempotent ROI Scheduler

**Decision:** Daily ROI runs through `RoiSchedulerService` with idempotency keys per investment per calendar date. Duplicate runs return zero without double-crediting.

**Rationale:** Cron jobs may retry; interruptions must resume safely; financial integrity requires at-most-once crediting per accrual period.

**Implications:**
- Keys: `roi-accrual-{investmentId}-{YYYY-MM-DD}`
- `roi_processing_runs` table logs every execution for diagnostics
- Dry-run mode for admin testing without ledger writes
- Vercel Cron at `/api/cron/roi` protected by `CRON_SECRET`

---

## ADR-028: Referral Commission on Activation Only

**Decision:** Referral commissions are paid when an investment is activated (deposit approved or reinvest confirmed), not on registration or deposit submission.

**Rationale:** Commissions must reflect funded positions; failed deposits and sign-ups should not generate payouts.

**Implications:**
- `payReferralCommissionInTransaction()` inside activation flow
- Idempotency key `referral-commission-{investmentId}`
- Percentage from plan config; architecture supports future multi-level rules

---

## ADR-029: Database-Driven Investment Plans

**Decision:** Investment plans are fully stored in `investment_plans` with admin-manageable fields (ROI rates, limits, lock/maturity periods, compounding, visibility). Marketing and deposit flows read from the database.

**Rationale:** Business users must manage plans without code changes; legacy hardcoded tiers are seeded once for parity testing.

**Implications:**
- Migration `0011` seeds Silver/Gold/Classic/Master with legacy-compatible values
- `PlansPreview` uses `listVisible()` with static fallback when DB unavailable
- Reinvestment respects `reinvest_enabled` and `max_reinvest_cycles` per plan

---

## ADR-030: Service-Backed Admin Console

**Decision:** All admin UI reads and writes through dedicated admin services. Pages never query the database directly for business logic.

**Rationale:** Single source of truth, testable business rules, consistent audit logging, and graceful infrastructure degradation via `guardDatabase()`.

**Implications:**
- `AdminDashboardService`, `CustomerAdminService`, etc. encapsulate admin operations
- API routes delegate to services with RBAC checks
- Server components call services directly; client components call API routes

---

## ADR-031: Audited Administrative Mutations

**Decision:** Every administrative mutation (status change, setting update, feature flag toggle, ledger correction) must call `AuditService.log()` with actor, before/after state, and reason where applicable.

**Rationale:** Financial platform requires immutable accountability; admin actions must be traceable for compliance.

**Implications:**
- Customer suspend/lock, plan changes, flag toggles all audited
- Manual ledger corrections require reason field
- Audit center reads from `audit_logs` table only (append-only)

---

## ADR-032: Ledger Corrections via Service Only

**Decision:** Manual balance corrections post through `LedgerAdminService.postCorrection()` using `LedgerService.postEntry()` with `admin_adjustment` entry type. No direct balance column updates.

**Rationale:** Preserves immutable ledger principles established in M4–M7.

**Implications:**
- Requires `LEDGER_ADJUST` permission
- Idempotency keys on every correction
- `allowNegative: true` only for admin corrections

---

## ADR-033: Plan Changes Isolated from Active Investments

**Decision:** Investment plan admin updates modify `investment_plans` rows only. Existing investments retain their plan terms at activation time.

**Rationale:** Changing ROI rates or duration for active positions would violate customer agreements and break financial integrity.

**Implications:**
- Plan CRUD affects new deposits/reinvestments only
- Duplicate creates inactive copy for editing before activation
- Archive soft-deletes plan without affecting historical investments

---

## ADR-034: Immutable Legacy Source for Migration

**Decision:** The legacy SQL dump and PHP codebase are read-only migration sources. The ETL pipeline never writes to or modifies legacy data.

**Rationale:** Parallel systems during transition require a stable reference for balance verification and audit disputes.

**Implications:**
- Parser reads `u973246624_uniqueskyway.20260623211625.sql` directly
- Profile images read from `u_images/` directory
- Legacy DB credentials are not required for migration

---

## ADR-035: Migration Password Strategy

**Decision:** Legacy plaintext passwords are never imported. Migrated users receive Supabase Auth accounts with cryptographically random passwords and `password_reset_required` metadata.

**Rationale:** Legacy stored passwords in plaintext (see `login.php`). Importing them would perpetuate a critical security vulnerability.

**Implications:**
- All migrated customers must reset passwords at cutover
- `email_confirm: true` set on migration for immediate access after reset
- Cutover communication must include password reset instructions

---

## ADR-036: Migration Idempotency Keys

**Decision:** Every migrated entity uses a deterministic idempotency key (`legacy-m9:{entity}:{legacyId}`) stored in `migration_idempotency`.

**Rationale:** Migration must be safely re-runnable before cutover without duplicate users, ledger entries, or investments.

**Implications:**
- Re-running load phase skips already-imported records
- Rollback deletes by run ID linkage
- Ledger entries use unique idempotency keys per transaction component

---

## ADR-037: Super Admin Only Migration Access

**Decision:** Migration tools (`/admin/migration`, `/api/admin/migration/*`) require Super Admin role and `migration.run` permission.

**Rationale:** Migration can create/delete customer accounts and financial records — highest privilege operation on the platform.

**Implications:**
- `requireSuperAdmin()` guard on all migration API routes
- Migration tables have admin-only RLS policies
- Other admin roles cannot access migration dashboard

---

## ADR-038: Resend + React Email for Transactional Communications

**Decision:** All transactional customer and admin emails are rendered with React Email templates and delivered via Resend. Auth-related emails (welcome, verify, password reset) send directly from auth flows; financial emails queue through the notification processor.

**Rationale:** React Email provides maintainable, type-safe HTML templates with plain text fallbacks. Resend offers reliable delivery, domain verification, and simple API integration suitable for a fintech platform without operating a mail server.

**Implications:**
- Templates live in `src/emails/` with shared layout components
- `EmailService` is the only send path; pages never call Resend directly
- Missing `RESEND_API_KEY` skips email with structured log warning — in-app notifications unaffected
- `EMAIL_FROM` must match a verified Resend domain in production

---

## ADR-039: Async Email Delivery via Cron Processor

**Decision:** Financial notification emails are queued as `notifications` rows with `channel=email` and `status=pending`. Delivery is processed by `NotificationProcessorService` via `/api/cron/notifications` every 15 minutes — not inline in request handlers.

**Rationale:** Decoupling email delivery from financial transactions prevents Resend latency or failures from blocking deposit approvals, withdrawal completions, or ROI accruals. Retries (max 3) handle transient delivery failures without re-running financial logic.

**Implications:**
- `NotificationService.notifyProfile()` creates in-app immediately and queues email
- Cron batch size: 25 events + 25 emails per invocation
- Failed emails marked after 3 attempts; admin can review in `/admin/notifications`
- Auth emails (password reset) may send synchronously from auth flows

---

## ADR-040: Structured JSON Logging

**Decision:** Application logging uses a structured JSON logger (`src/lib/logging/logger.ts`) emitting to stdout with fixed categories: `app`, `security`, `financial`, `scheduler`, `email`, `migration`, `admin`.

**Rationale:** Plain console.log is difficult to search and filter in production. JSON lines are compatible with Vercel log drains and future log aggregation without code changes.

**Implications:**
- All services log via `logger.info/warn/error(category, message, metadata)`
- Error logs include optional `errorId` for correlation with `AppError` responses
- No PII in default metadata — callers must avoid logging passwords, tokens, full account numbers
- Request correlation IDs deferred to future milestone

---

## ADR-042: Platform Wallets (Phase 1 — Manual Launch)

**Decision:** Deposit wallet addresses are stored in `platform_wallets` — company-owned configuration managed by administrators, not tied to individual admin accounts. Customer deposits snapshot wallet details on `deposit_requests` at submission time.

**Rationale:** Hardcoded wallet addresses in payment method config do not scale to unlimited assets/networks and cannot support Phase 2 (blockchain monitoring) or Phase 3 (automatic deposits) without schema redesign. Snapshots preserve audit accuracy when wallets change.

**Implications:**
- `platform_wallets_enabled` feature flag gates customer deposits; admins can configure wallets while disabled
- One primary wallet per asset+network enforced in `PlatformWalletService`
- `auto_detection_enabled` and `required_confirmations` columns reserved for Phase 2
- Deposit approval still flows through existing `DepositService.approveDeposit()` → investment engine → ledger
- No ledger entries or investments created on customer submit (`status: submitted`)

---

**Decision:** Production deployments use a privacy shield middleware that blocks search engine crawlers, sets restrictive `X-Robots-Tag` headers, and optionally enforces link-only access via `SITE_ACCESS_KEY` (query param → cookie).

**Rationale:** Unique Sky Way operates as an invite-only fintech platform during transition from legacy. Preventing indexing and unauthorized discovery reduces security exposure before public launch.

**Implications:**
- `SITE_ACCESS_KEY` set in production env until public launch approved
- Access URL format: `https://uniqueskyway.com?access=YOUR_SECRET_KEY`
- Exempt paths: `/api/health`, `/robots.txt`
- Remove or rotate key when transitioning to public marketing launch
- Generate key: `openssl rand -hex 32`
