# API Documentation — Unique Sky Way Platform v1.0

REST API reference for the Next.js application. All routes are relative to `NEXT_PUBLIC_APP_URL`.

**Authentication:** Customer routes require Supabase session cookie. Admin routes require admin session + RBAC permission. Cron routes require `CRON_SECRET`.

**Error format:**

```json
{
  "error": "User-safe message",
  "code": "ERROR_CODE",
  "errorId": "uuid-for-support"
}
```

---

## Health & Public

### `GET /api/health`

Public health check (exempt from privacy shield).

**Response 200:**

```json
{
  "status": "ok",
  "version": "0.1.0",
  "integrations": {
    "supabase": true,
    "database": true,
    "storage": true,
    "email": true
  },
  "queues": { "notificationsPending": 0, "notificationsFailed": 0 },
  "scheduler": { "lastRoiRun": "2026-07-05T06:00:00Z" }
}
```

### `GET /api/settings/public`

Public platform settings (site name, maintenance message). Rate limited.

### `GET /api/investment-plans`

Visible investment plans for marketing/register flows.

### `GET /api/payment-methods`

Active payment methods for deposit form.

### `GET /api/withdrawal-methods`

Active withdrawal methods.

---

## Authentication

All auth routes rate-limited (`auth` profile: 10 req/min).

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | `{ name, email, password, username?, referralCode? }` | Create account |
| POST | `/api/auth/login` | `{ email, password }` | Customer login |
| POST | `/api/auth/logout` | — | End session |
| POST | `/api/auth/forgot-password` | `{ email }` | Send reset email |
| POST | `/api/auth/reset-password` | `{ token, password }` | Complete reset |
| POST | `/api/auth/change-password` | `{ currentPassword, newPassword }` | Authenticated change |
| POST | `/api/auth/resend-verification` | `{ email }` | Resend verify email |
| GET | `/api/auth/sessions` | — | List active sessions |
| POST | `/api/auth/admin/login` | `{ email, password }` | Admin portal login |

---

## Customer Dashboard

Requires authenticated customer session.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/summary` | Dashboard KPIs |
| GET | `/api/dashboard/wallet` | Wallet balances |
| GET | `/api/dashboard/portfolio` | Active investments |
| GET | `/api/dashboard/activity` | Recent activity feed |
| GET | `/api/dashboard/profile` | Profile data |
| PATCH | `/api/dashboard/profile` | Update profile |
| GET | `/api/dashboard/notifications` | Notification list |
| PATCH | `/api/dashboard/notifications` | Mark read/archive |
| GET | `/api/dashboard/security` | Security settings |
| POST | `/api/dashboard/deposits` | Submit deposit request |
| GET | `/api/dashboard/deposits` | List deposits |
| GET | `/api/dashboard/deposits/[id]` | Deposit detail |
| POST | `/api/dashboard/withdrawals` | Submit withdrawal |
| GET | `/api/dashboard/withdrawals` | List withdrawals |
| GET | `/api/dashboard/withdrawals/[id]` | Withdrawal detail |
| POST | `/api/dashboard/reinvest` | Reinvest matured funds |

---

## Storage (Authenticated)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/storage/avatars/[...path]` | Serve avatar image |
| GET | `/api/storage/payment-proofs/[...path]` | Serve payment proof |

Uploads handled via Supabase Storage client with RLS policies.

---

## Admin API

Requires admin session + permission. Base path: `/api/admin/`.

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/dashboard` | `dashboard:read` | Admin KPIs |
| GET | `/customers` | `customers:read` | Customer list |
| GET/PATCH | `/customers/[id]` | `customers:*` | Customer detail/actions |
| GET | `/deposits` | `deposits:read` | Deposit queue |
| GET/PATCH | `/deposits/[id]` | `deposits:approve` | Review deposit |
| GET | `/withdrawals` | `withdrawals:read` | Withdrawal queue |
| GET/PATCH | `/withdrawals/[id]` | `withdrawals:approve` | Review withdrawal |
| GET | `/investments` | `investments:read` | Investment list |
| GET/PATCH | `/investments/[id]` | `investments:manage` | Investment detail |
| GET | `/ledger` | `ledger:read` | Ledger explorer |
| GET | `/treasury` | `treasury:read` | Treasury queue |
| PATCH | `/treasury` | `treasury:complete` | Complete payout |
| GET | `/plans` | `plans:read` | Investment plans |
| POST/PATCH | `/plans/[id]` | `plans:manage` | Plan CRUD |
| GET | `/payment-methods` | `settings:read` | Payment methods |
| PATCH | `/payment-methods` | `settings:manage` | Update methods |
| GET/PATCH | `/settings` | `settings:*` | System settings |
| GET/PATCH | `/feature-flags` | `settings:manage` | Feature flags |
| GET | `/audit` | `audit:read` | Audit log |
| GET | `/reports` | `reports:read` | Financial reports |
| GET | `/referrals` | `referrals:read` | Referral data |
| GET | `/risk` | `risk:read` | Risk indicators |
| GET | `/search` | `search:read` | Global search |
| GET/POST | `/notifications` | `notifications:manage` | Broadcast/delivery |
| GET/POST | `/migration` | `migration:execute` | Migration runs (Super Admin) |
| GET | `/migration/[id]` | `migration:read` | Migration run detail |

---

## Cron (Scheduled)

Authenticated via `Authorization: Bearer $CRON_SECRET` or `?secret=$CRON_SECRET`.

| Method | Path | Schedule | Description |
|--------|------|----------|-------------|
| POST | `/api/cron/roi` | Daily 06:00 UTC | Process ROI accrual |
| POST | `/api/cron/notifications` | Every 15 min | Process email queue |

**Manual trigger (staging):**

```bash
curl -X POST "https://staging.uniqueskyway.com/api/cron/roi" \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## Auth Callback

| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/callback` | Supabase OAuth/email callback handler |

---

## Rate Limits

| Profile | Limit | Applied To |
|---------|-------|------------|
| `auth` | 10/min | Login, register, password reset |
| `api` | 60/min | General API |
| `financial` | 20/min | Deposits, withdrawals, reinvest |
| `publicForm` | 5/min | Public forms |

Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Service Layer

Business logic lives in `src/lib/services/`. API routes are thin wrappers — see `DEVELOPER_GUIDE.md` for service inventory and patterns.

---

## Versioning

v1.0 — no API versioning prefix. Breaking changes require coordinated frontend deployment.
