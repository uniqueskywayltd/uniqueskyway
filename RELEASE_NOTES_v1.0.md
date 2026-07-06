# Release Notes — Unique Sky Way Platform v1.0

**Release:** 1.0.0  
**Date:** July 2026  
**Codename:** Production Ready  
**Status:** Feature-complete — staging validation required before public launch

---

## Overview

Unique Sky Way v1.0 is a complete rebuild of the investment platform on modern infrastructure. This release delivers a secure, ledger-based financial platform with customer and admin portals, automated ROI processing, referral commissions, and legacy data migration capabilities.

---

## What's New

### Customer Experience

- **Modern marketing site** — Professional fintech homepage, services, investments, FAQ, security, referrals, and contact pages with brand photography
- **Secure registration & login** — Email verification, password reset, session management, login alerts
- **Investor dashboard** — Wallet, portfolio, deposits, withdrawals, activity, notifications, profile, security settings
- **Investment plans** — Silver, Gold, Classic, Master tiers with configurable ROI and duration
- **Reinvestment** — Matured investment proceeds can be reinvested into active plans
- **Referral program** — Referral codes, commission tracking, tier visibility

### Financial Engine

- **Double-entry ledger** — All balances derived from immutable ledger entries; no balance columns
- **Deposit workflow** — Customer submission → admin review → ledger credit
- **Withdrawal workflow** — Request → approval → treasury completion
- **Daily ROI accrual** — Automated scheduler with idempotent processing
- **Referral commissions** — Automatic calculation on qualifying deposits

### Admin Console

- **Dashboard** — KPIs, queue depths, system health
- **Customer management** — Search, detail, notes, status controls
- **Deposit & withdrawal queues** — Review, approve, reject with audit trail
- **Investment management** — Active investments, manual interventions
- **Ledger explorer** — Full transaction history with filters
- **Treasury** — Pending payout tracking and completion
- **Reports** — Financial summaries and export-ready data
- **Audit center** — Complete admin action log
- **Feature flags** — Controlled rollout of registrations, deposits, withdrawals, investments, referrals
- **System settings** — Platform configuration without code changes
- **Migration dashboard** — Legacy ETL execution and verification (Super Admin only)
- **Risk monitoring** — Anomaly indicators and flagged accounts
- **Notifications** — Broadcast and delivery tracking

### Operations & Communications

- **Transactional email** — 15+ templates via Resend (deposits, withdrawals, investments, auth, referrals)
- **In-app notifications** — Real-time customer notification center
- **Email queue processor** — 15-minute cron with retry logic
- **Health endpoint** — `/api/health` for deployment verification

### Security & Compliance

- **Row Level Security** — Postgres RLS on all customer data tables
- **RBAC** — Role-based admin permissions (Super Admin, Admin, Finance, Support, Read-only)
- **Privacy shield** — Pre-launch access gate via `SITE_ACCESS_KEY`
- **Rate limiting** — Auth, API, and financial endpoint throttling
- **Audit logging** — All admin mutations recorded with actor, timestamp, and payload

### Legacy Migration

- **ETL pipeline** — Parse legacy SQL dump, transform to ledger schema, validate balances
- **Dry-run mode** — Offline validation without database writes
- **Avatar migration** — Legacy profile images to Supabase Storage
- **Password reset delivery** — Force password reset for migrated users

---

## Technical Specifications

| Component | Version |
|-----------|---------|
| Next.js | 16.2.10 |
| React | 19.2.4 |
| Drizzle ORM | 0.45.2 |
| Supabase JS | 2.110.0 |
| Node.js | 20.x recommended |

**Routes:** 100 pages/API endpoints  
**Migrations:** 14 SQL files (0000–0013)  
**Email templates:** 15+

---

## Known Limitations

See [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) for the complete list. Highlights:

- Contact form displays confirmation locally (no backend email integration)
- Wallet CSV export button is disabled (planned enhancement)
- Rate limiting uses in-memory store (single-instance; use Redis for multi-region scale)
- No external APM integration (use Vercel logs + Supabase dashboard)

---

## Upgrade / Migration Notes

For existing Unique Sky Way customers:

1. Complete staging migration dry-run (`npm run migration:dry-run`)
2. Resolve duplicate username `Salman26` before live import
3. Execute live migration per `MIGRATION_GUIDE.md`
4. Verify zero balance discrepancies
5. Deliver password reset emails to all migrated users
6. Enable feature flags in phased sequence per `CUTOVER_PLAN.md`

---

## Documentation

Full handover package: [FINAL_HANDOVER.md](./FINAL_HANDOVER.md)

---

*v1.0.0 — Feature-complete platform rebuild. Staging validation and production deployment pending client credentials and sign-off.*
