# Client Admin Guide — Unique Sky Way

This guide is for **operations staff, finance teams, and administrators** who use the admin console at `/admin`. No development experience is required.

**Platform:** Unique Sky Way (`uniqueskyway.com`)  
**Last updated:** Milestone 10 — July 2026

---

## Getting Started

### Signing In

1. Navigate to `/admin/login` (or `/login` and follow the admin link if configured).
2. Use your admin email and password. Accounts are created by a Super Admin via bootstrap or manual provisioning.
3. Your role determines which pages and actions you can access. If you see "Forbidden" or missing menu items, contact a Super Admin to review your role permissions.

### Roles Overview

| Role | Typical use |
|------|-------------|
| **Super Admin** | Full access including migration, ledger corrections, and admin user management |
| **Administrator** | Day-to-day operations: customers, deposits, withdrawals, investments, settings |
| **Finance** | Deposits, withdrawals, treasury, ledger read, reports |
| **Support** | Customer lookup, notes, limited account actions |
| **Compliance** | Audit logs, risk events, referral review |
| **Read Only** | Dashboard and reports without mutation rights |

Every action you take that changes data is recorded in the **Audit Center**.

---

## Dashboard

**Path:** `/admin`

The executive dashboard is your morning briefing:

- **Users** — total, active, new registrations
- **Assets under management (AUM)** — sum of active investment principal
- **Queues** — pending deposits and withdrawals needing review
- **Revenue** — ROI paid, referral commissions, daily/monthly totals
- **ROI scheduler** — last run status and next expected accrual window
- **System health** — database, email, storage integration status
- **Recent admin activity** — latest audited actions

Use the dashboard to prioritize work: clear deposit and withdrawal queues before end of day, and investigate any degraded health indicators.

---

## Customers

**Path:** `/admin/customers` → `/admin/customers/[id]`

### Customer List

Search by name, email, username, or referral code. Filter by account status (active, suspended, locked).

### Customer Detail

Each customer profile shows:

- Wallet balances (available, invested, pending withdrawal, locked)
- Active and matured investments
- Referral tree and commission history
- Login history and registered devices
- Risk events (informational — no automatic blocks)
- Internal admin notes

### Common Actions

| Action | When to use | Notes |
|--------|-------------|-------|
| **Suspend** | Policy violation, fraud investigation | Customer cannot transact; balances preserved |
| **Activate** | After investigation cleared | Restores normal access |
| **Lock / Unlock** | Temporary hold on account | Distinct from suspend; used for security holds |
| **Disable login** | Compromised credentials | Forces re-authentication workflow |
| **Force email verification** | Customer cannot receive mail | Marks email verified after manual identity check |
| **Password reset** | Customer locked out | Sends reset email; action is audited |
| **Add note** | Internal communication | Notes are never visible to the customer |

All actions require appropriate permissions and appear in the audit log with your admin ID.

---

## Deposits

**Path:** `/admin/deposits` → `/admin/deposits/[id]`

### Deposit Lifecycle

```
submitted → under_review → processing → approved / rejected
```

### Review Checklist

1. Open the deposit from the queue or customer profile.
2. Verify **amount**, **investment plan**, and **payment method**.
3. Check **payment reference** and **proof of payment** (if uploaded).
4. Confirm the payment matches your treasury records.

### Actions

| Action | Effect |
|--------|--------|
| **Approve** | Creates investment, posts ledger entries, pays referral commission (if applicable), sends customer notification and email |
| **Reject** | Closes request with reason; customer notified |
| **Request info** | Moves to `under_review`; customer prompted to provide details |

**Important:** Approval is atomic — investment creation, ledger posts, referral payout, and notifications happen in one transaction. If approval fails, nothing is partially applied.

---

## Withdrawals

**Path:** `/admin/withdrawals` → `/admin/withdrawals/[id]`

### Withdrawal Lifecycle

```
submitted → approved → processing → completed
                ↓
            rejected (funds released if previously reserved)
```

### Review Checklist

1. Confirm **withdrawable balance** covers the request.
2. Review **risk indicators** (large amount, multiple recent requests, new device — informational only).
3. Validate **payout destination** (wallet address, bank details) against customer KYC records.
4. Approve only when treasury is ready to pay.

### Actions

| Action | Effect |
|--------|--------|
| **Approve** | Reserves funds (`available` → `pending_withdrawal`) |
| **Reject** | Closes request; reverses reservation if already approved |
| **Request info** | Pauses for customer clarification |
| **Mark processing** | Indicates treasury is executing payout |
| **Mark completed** | Finalizes ledger outflow; customer notified |

Approved withdrawals appear in the **Treasury** queue for payout execution.

---

## Investments

**Path:** `/admin/investments` → `/admin/investments/[id]`

View all customer investments with status, plan, principal, accrued ROI, and maturity date.

### Admin Actions

| Action | When to use |
|--------|-------------|
| **Pause** | Stop ROI accrual temporarily (compliance hold) |
| **Resume** | Restore accrual after hold cleared |
| **Force maturity** | End investment early (exception cases only; audited) |
| **Manual adjustment** | Ledger correction tied to investment (Super Admin / Finance with permission) |

Plan terms at activation are **frozen** — changing a plan in `/admin/plans` does not alter existing investments.

---

## Treasury

**Path:** `/admin/treasury`

The treasury module manages **payout execution** after withdrawal approval:

- **Payout queue** — approved withdrawals awaiting disbursement
- **Processing lifecycle** — mark in-progress, complete, or fail
- **Volume metrics** — daily/weekly outflow totals

Current implementation uses **manual payout** (USDT TRC20, BTC, ETH, bank transfer). Mark completed only after funds have actually left your treasury accounts.

---

## Financial Operations Hub

**Path:** `/admin/operations`

Central link to deposits, withdrawals, investments, treasury, ledger explorer, referrals, and ROI history. Use this when investigating a customer's full financial picture across modules.

### Ledger Explorer

**Path:** `/admin/ledger`

Search immutable ledger entries by customer, entry type, date, or reference. Manual corrections require:

- `LEDGER_ADJUST` permission
- Written **reason** (stored in audit log)
- Idempotency key (system-generated)

Never attempt balance fixes outside the ledger correction workflow.

---

## Reports

**Path:** `/admin/reports`

| Report | Contents |
|--------|----------|
| **Daily activity** | Registrations, deposits, withdrawals, investments for selected date |
| **Referral performance** | Top referrers, commission totals |
| **Investment performance** | Active/matured counts, AUM breakdown by plan |
| **ROI run history** | Scheduler execution logs, accrual counts, errors |

Export or screenshot reports for finance reconciliation. Reports read from live data — refresh before presenting to stakeholders.

---

## Feature Flags

**Path:** `/admin/feature-flags`

Operational toggles control what customers can do **right now**:

| Flag | Controls |
|------|----------|
| `registrations_enabled` | New sign-ups |
| `deposits_enabled` | Deposit submissions |
| `withdrawals_enabled` | Withdrawal submissions |
| `investments_enabled` | New investment activation |
| `referrals_enabled` | Referral commission payouts |
| `maintenance_mode` | Platform-wide maintenance banner and blocked actions |

Toggle changes are **audited**. During cutover or incidents, maintenance mode is the primary customer-facing control. Coordinate flag changes with finance before enabling live money flows.

---

## Settings

**Path:** `/admin/settings`

Business configuration values (not on/off toggles):

- Company name, email, phone, address
- Platform timezone (affects ROI scheduler and report dates)
- Referral commission percentage
- Deposit minimum/maximum limits
- Withdrawal limits and lock periods

Changes take effect immediately for **new** transactions. Existing investments retain their activation terms.

---

## Notifications

**Path:** `/admin/notifications`

### Delivery Log

View all in-app and email notifications with status (`sent`, `pending`, `failed`).

### Broadcast

Send an **in-app announcement** to all customers or a selected subset. Requires `EMAIL_BROADCAST` permission for email broadcasts.

**Note:** Transactional emails (deposit approved, withdrawal completed, etc.) are sent automatically by the notification processor cron. You do not need to send these manually.

---

## Migration

**Path:** `/admin/migration` — **Super Admin only**

Used during legacy platform cutover. See `MIGRATION_GUIDE.md` and `CUTOVER_PLAN.md` for the full procedure.

### Quick Reference

1. Run **dry migration** first — balance exceptions must be **zero**.
2. Review validation report for orphan transactions and duplicate usernames.
3. Execute **live migration** only during the approved cutover window.
4. Run verify phase and spot-check customer accounts.
5. Rollback is available before DNS cutover if discrepancies are found.

Do not run live migration without stakeholder sign-off.

---

## Global Search

**Path:** `/admin/search`

Search across users, deposits, withdrawals, investments, ledger entries, and audit logs from one query box. Useful for support tickets referencing a reference ID or email address.

---

## Compliance Modules

### Audit Center — `/admin/audit`

Immutable log of all admin and system actions. Filter by actor, action type, date, or entity ID. Required for dispute resolution and regulatory inquiries.

### Risk Center — `/admin/risk`

Lists risk events (large withdrawals, device changes, velocity patterns). **Informational only** — no automatic blocking. Use alongside customer notes and audit logs for investigations.

### Referrals — `/admin/referrals`

Referral graph, commission history, and top referrers. Commissions are paid on **investment activation**, not registration.

---

## Troubleshooting

### Customer cannot log in

1. Check account status (suspended, locked, login disabled).
2. Verify email is confirmed or force verification after identity check.
3. Initiate password reset from customer detail page.
4. Review login history for lockout triggers.

### Deposit approved but investment missing

1. Check audit log for the approval event and any error.
2. Search ledger for entries with the deposit reference ID.
3. If approval partially failed, escalate to Super Admin — do not manually edit balances.

### Withdrawal stuck in pending

1. Confirm it was **approved** (funds reserved).
2. Check treasury queue — mark processing, then completed after payout.
3. If rejecting after approval, funds return to available balance automatically.

### Customer not receiving emails

1. Check `/admin/notifications` for `failed` email deliveries.
2. Verify Resend is configured (dashboard system health shows email integration).
3. Ask customer to check spam; confirm email address on profile.
4. Failed emails retry up to 3 times via the notification cron.

### Dashboard shows degraded health

| Indicator | Likely cause | Action |
|-----------|--------------|--------|
| Database down | Supabase outage or misconfigured `DATABASE_URL` | Contact engineering |
| Email not configured | Missing `RESEND_API_KEY` | Emails queue but don't send |
| Storage unavailable | Missing service role key | Avatar uploads disabled |

Check `/api/health` for a JSON diagnostics report (engineering use).

### Feature appears unavailable to customers

1. Check the relevant **feature flag** is enabled.
2. Confirm **maintenance mode** is off.
3. Verify **privacy shield** access key if site is in pre-launch mode (customers need the access link).

---

## Best Practices

1. **Always add a note** when taking exceptional action on a customer account.
2. **Never share admin credentials** — each operator should have their own account.
3. **Approve deposits only after treasury confirmation** — ledger posts are irreversible without a formal correction.
4. **Complete treasury payouts same day** when possible — customers expect timely withdrawals.
5. **Review audit logs weekly** for anomalous admin activity.
6. **Coordinate flag changes** with finance and engineering before go-live.

---

## Related Documentation

| Document | Audience |
|----------|----------|
| `MIGRATION_GUIDE.md` | Super Admin — legacy data import |
| `CUTOVER_PLAN.md` | Ops — production cutover sequence |
| `ROLLBACK_PLAN.md` | Ops — emergency rollback |
| `DEPLOYMENT_CHECKLIST.md` | Engineering/Ops — launch checklist |
| `TEST_PLAN.md` | QA — end-to-end verification |

For technical issues beyond this guide, contact the platform engineering team with the **error ID** shown to customers (if any) and the approximate time of the incident.
