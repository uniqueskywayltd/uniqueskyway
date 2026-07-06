# Test Plan — Unique Sky Way Platform

End-to-end verification checklist for staging and pre-production environments. Execute before go-live and after significant releases.

**Environment:** Staging (preferred) or production with feature flags disabled  
**Reference:** `DEPLOYMENT_CHECKLIST.md` for deploy gates  
**Last updated:** Milestone 10 — July 2026

---

## Test Conventions

| Symbol | Meaning |
|--------|---------|
| ☐ | Not tested |
| ☑ | Pass |
| ☒ | Fail |
| ⊘ | Blocked / N/A |

Record **tester name**, **date**, **environment URL**, and **build/version** at the top of each test run.

```
Tester: _______________
Date: _______________
Environment: _______________
Version: _______________
```

---

## 0. Prerequisites

- [ ] `DATABASE_URL`, Supabase keys, and `RESEND_API_KEY` configured
- [ ] Migrations `0000`–`0013` applied
- [ ] Super Admin bootstrapped (`npm run bootstrap:admin`)
- [ ] Test customer account available (or register if `registrations_enabled`)
- [ ] `CRON_SECRET` configured for manual cron triggers
- [ ] `/api/health` returns `status: "ok"`

---

## 1. Authentication

### 1.1 Customer Registration

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1.1.1 | Navigate to `/register` with `registrations_enabled=true` | Form loads | ☐ |
| 1.1.2 | Submit valid registration (name, email, password, captcha) | Account created, redirect to dashboard or verify prompt | ☐ |
| 1.1.3 | Submit duplicate email | Validation error | ☐ |
| 1.1.4 | Register with `registrations_enabled=false` | Feature blocked message | ☐ |
| 1.1.5 | Register with referral code in URL | Referral relationship created | ☐ |

### 1.2 Customer Login

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1.2.1 | Login with valid credentials | Dashboard loads | ☐ |
| 1.2.2 | Login with wrong password | Error message, no session | ☐ |
| 1.2.3 | Login after multiple failures | Rate limit / lockout message | ☐ |
| 1.2.4 | Login from new device | Login alert email received | ☐ |
| 1.2.5 | Session persists after page refresh | Still authenticated | ☐ |
| 1.2.6 | Logout | Session cleared, redirect to login | ☐ |

### 1.3 Password & Email Verification

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1.3.1 | Request password reset | Reset email received (Resend) | ☐ |
| 1.3.2 | Complete password reset via link | Password changed, can login | ☐ |
| 1.3.3 | Password changed notification email | Email received | ☐ |
| 1.3.4 | Email verification flow | Verify email received and link works | ☐ |

### 1.4 Admin Authentication

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1.4.1 | Admin login at `/admin` | Admin dashboard loads | ☐ |
| 1.4.2 | Customer session cannot access `/admin` | Forbidden / redirect | ☐ |
| 1.4.3 | Read-only role cannot approve deposits | Permission denied | ☐ |
| 1.4.4 | Non-Super Admin cannot access `/admin/migration` | Forbidden | ☐ |

---

## 2. Dashboard

| # | Step | Expected | Result |
|---|------|----------|--------|
| 2.1 | Customer dashboard loads | Wallet summary, recent activity visible | ☐ |
| 2.2 | Balances match ledger | Available + invested + pending = expected | ☐ |
| 2.3 | Active investments listed | Correct plan, principal, status | ☐ |
| 2.4 | Notification bell shows unread count | Count matches unread notifications | ☐ |
| 2.5 | Infrastructure banner (if DB missing) | Graceful message, no crash | ☐ |
| 2.6 | Admin dashboard KPIs load | Users, AUM, queues, health visible | ☐ |
| 2.7 | Admin recent activity feed | Shows latest audited actions | ☐ |

---

## 3. Wallet

| # | Step | Expected | Result |
|---|------|----------|--------|
| 3.1 | Wallet page shows account breakdown | Available, invested, pending withdrawal, locked | ☐ |
| 3.2 | Transaction history lists ledger-derived entries | Correct amounts and types | ☐ |
| 3.3 | Withdrawable balance respects lock period | Locked portion excluded | ☐ |
| 3.4 | Preferred currency display | Matches profile setting | ☐ |

---

## 4. Deposits

**Requires:** `deposits_enabled=true`, active investment plan, payment method configured

| # | Step | Expected | Result |
|---|------|----------|--------|
| 4.1 | Deposit form loads with active plans | Plan selector populated | ☐ |
| 4.2 | Submit deposit (amount, method, reference) | Status `submitted`, confirmation shown | ☐ |
| 4.3 | Upload payment proof | File stored in `payment-proofs` bucket | ☐ |
| 4.4 | In-app notification on submit | Notification appears | ☐ |
| 4.5 | Email on submit (within 15 min) | Deposit submitted email received | ☐ |
| 4.6 | Admin sees deposit in queue | `/admin/deposits` lists request | ☐ |
| 4.7 | Admin approves deposit | Investment created, ledger entries posted | ☐ |
| 4.8 | Customer balance updated after approval | Available/invested reflect approval | ☐ |
| 4.9 | Email on approval | Deposit approved email received | ☐ |
| 4.10 | Admin rejects deposit | Status rejected, reason stored | ☐ |
| 4.11 | Admin requests info | Status `under_review`, customer notified | ☐ |
| 4.12 | Duplicate submit with same idempotency | No double investment | ☐ |
| 4.13 | Deposit with `deposits_enabled=false` | Blocked with message | ☐ |

---

## 5. Withdrawals

**Requires:** `withdrawals_enabled=true`, customer with withdrawable balance

| # | Step | Expected | Result |
|---|------|----------|--------|
| 5.1 | Withdrawal form shows withdrawable balance | Correct amount displayed | ☐ |
| 5.2 | Submit withdrawal | Status `submitted`, funds not yet debited | ☐ |
| 5.3 | Risk event recorded (if threshold met) | Event in admin risk center | ☐ |
| 5.4 | In-app + email notification on submit | Both channels | ☐ |
| 5.5 | Admin approves withdrawal | Funds reserved (available → pending) | ☐ |
| 5.6 | Admin rejects withdrawal | No fund movement (or reversal if post-approve) | ☐ |
| 5.7 | Treasury: mark processing → completed | Final ledger debit, customer notified | ☐ |
| 5.8 | Customer cancels pending withdrawal | Request cancelled, no reservation | ☐ |
| 5.9 | Withdrawal exceeding balance | Validation error | ☐ |
| 5.10 | Withdrawal with `withdrawals_enabled=false` | Blocked | ☐ |

---

## 6. Investments

| # | Step | Expected | Result |
|---|------|----------|--------|
| 6.1 | Portfolio list shows all investments | Active, paused, matured statuses | ☐ |
| 6.2 | Investment detail page | Plan terms, principal, accrued ROI, timeline | ☐ |
| 6.3 | ROI preview on detail page | Estimated earnings, next accrual date | ☐ |
| 6.4 | Admin investment list | All customer investments searchable | ☐ |
| 6.5 | Admin pause investment | ROI accrual stops | ☐ |
| 6.6 | Admin resume investment | Accrual resumes | ☐ |
| 6.7 | Admin force maturity | Status matured, no further accrual | ☐ |
| 6.8 | Plan change does not affect active investment | Terms unchanged on existing position | ☐ |

---

## 7. ROI (Return on Investment)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 7.1 | Manual cron trigger: `/api/cron/roi` | 200 response, accrual count returned | ☐ |
| 7.2 | ROI credited to available balance | Ledger entry `roi_accrual` | ☐ |
| 7.3 | Duplicate cron same day | Zero additional credits (idempotent) | ☐ |
| 7.4 | ROI run logged in `roi_processing_runs` | Record with status | ☐ |
| 7.5 | Daily ROI email (within 15 min cron) | Email received | ☐ |
| 7.6 | Paused investment skipped | No accrual | ☐ |
| 7.7 | Matured investment skipped | No accrual | ☐ |
| 7.8 | Admin ROI history in reports | Run visible with stats | ☐ |

---

## 8. Reinvestments

**Requires:** Active investment with `reinvest_enabled`, sufficient available balance

| # | Step | Expected | Result |
|---|------|----------|--------|
| 8.1 | Reinvest form loads from portfolio | Plan and amount options shown | ☐ |
| 8.2 | Submit reinvestment | New investment created, balance debited | ☐ |
| 8.3 | Ledger entries correct | Available debit + invested credit | ☐ |
| 8.4 | In-app + email notification | Reinvestment completed | ☐ |
| 8.5 | Max reinvest cycles enforced | Blocked when limit reached | ☐ |

---

## 9. Referrals

**Requires:** `referrals_enabled=true`

| # | Step | Expected | Result |
|---|------|----------|--------|
| 9.1 | Referral link/code on dashboard | Unique code displayed | ☐ |
| 9.2 | New user registers via referral link | Relationship recorded | ☐ |
| 9.3 | Commission paid on referred user's investment activation | Ledger entry `referral_commission` | ☐ |
| 9.4 | No commission on registration alone | No payout | ☐ |
| 9.5 | Idempotent commission | Second activation attempt doesn't double-pay | ☐ |
| 9.6 | Referral commission email | Email received by referrer | ☐ |
| 9.7 | Admin referral report | Top referrers, commission totals | ☐ |

---

## 10. Notifications

| # | Step | Expected | Result |
|---|------|----------|--------|
| 10.1 | In-app notification on financial event | Appears within seconds | ☐ |
| 10.2 | Mark notification read | Unread count decrements | ☐ |
| 10.3 | Mark all read | All cleared | ☐ |
| 10.4 | Archive notification | Removed from active list | ☐ |
| 10.5 | Email queued and delivered | Status `sent` in admin delivery log | ☐ |
| 10.6 | Cron processes pending emails | `/api/cron/notifications` returns counts | ☐ |
| 10.7 | Failed email retries (3 max) | Retries then `failed` | ☐ |
| 10.8 | Admin broadcast in-app | All targeted customers receive | ☐ |
| 10.9 | Email disabled in preferences | In-app only, no email queued | ☐ |

---

## 11. Admin Console

| # | Step | Expected | Result |
|---|------|----------|--------|
| 11.1 | Customer search | Find by email, name, username | ☐ |
| 11.2 | Customer suspend / activate | Status changes, audited | ☐ |
| 11.3 | Customer notes | Add note, visible to admins only | ☐ |
| 11.4 | Global admin search | Cross-entity results | ☐ |
| 11.5 | Ledger explorer | Search entries by customer/type | ☐ |
| 11.6 | Manual ledger correction | Posts with reason, audited | ☐ |
| 11.7 | Feature flag toggle | Change persists, audited | ☐ |
| 11.8 | System setting update | Value persists | ☐ |
| 11.9 | Payment method toggle | Active/inactive state changes | ☐ |
| 11.10 | Investment plan CRUD | Create, duplicate, archive | ☐ |
| 11.11 | Audit center search | Find action by admin, date, entity | ☐ |
| 11.12 | Risk center listing | Events displayed | ☐ |

---

## 12. Migration

**Super Admin only — use staging or pre-cutover production**

| # | Step | Expected | Result |
|---|------|----------|--------|
| 12.1 | Dry-run migration via CLI | Report generated, no DB writes | ☐ |
| 12.2 | Dry-run via admin dashboard | Progress UI, stats displayed | ☐ |
| 12.3 | Balance verification: zero exceptions | All customers match legacy | ☐ |
| 12.4 | Validation warnings documented | Orphans, duplicates listed | ☐ |
| 12.5 | Idempotent re-run | Skips already-imported records | ☐ |
| 12.6 | Avatar migration | Images in Supabase Storage | ☐ |
| 12.7 | Rollback (staging) | Run data removed cleanly | ☐ |

---

## 13. Reporting

| # | Step | Expected | Result |
|---|------|----------|--------|
| 13.1 | Daily activity report | Correct counts for selected date | ☐ |
| 13.2 | Referral performance report | Commission totals match ledger | ☐ |
| 13.3 | Investment performance report | AUM by plan accurate | ☐ |
| 13.4 | ROI run history | Matches `roi_processing_runs` | ☐ |

---

## 14. Settings & Feature Flags

| # | Step | Expected | Result |
|---|------|----------|--------|
| 14.1 | Public settings API (`/api/settings/public`) | Company info returned | ☐ |
| 14.2 | Maintenance mode blocks customer actions | Banner + blocked flows | ☐ |
| 14.3 | Maintenance mode allows admin access | Admin console works | ☐ |
| 14.4 | Timezone setting affects report dates | Correct date boundaries | ☐ |
| 14.5 | Deposit limits enforced | Min/max from settings | ☐ |
| 14.6 | Referral percentage from settings | Commission calc matches | ☐ |

---

## 15. Health & Infrastructure

| # | Step | Expected | Result |
|---|------|----------|--------|
| 15.1 | `/api/health` returns 200 | JSON with status, integrations | ☐ |
| 15.2 | All integrations true in production | supabase, database, email, storage | ☐ |
| 15.3 | Privacy shield blocks without access key | 403 or gate page | ☐ |
| 15.4 | Access key grants entry | Cookie set, site accessible | ☐ |
| 15.5 | `/robots.txt` disallows crawlers | Correct content | ☐ |
| 15.6 | Cron unauthorized without secret | 401 response | ☐ |
| 15.7 | Cron authorized with secret | 200 response | ☐ |
| 15.8 | API error returns errorId | No stack trace exposed | ☐ |
| 15.9 | Build passes | `npm run build` succeeds | ☐ |
| 15.10 | Type check passes | `npm run type-check` succeeds | ☐ |

---

## Test Summary

| Section | Total | Pass | Fail | Blocked |
|---------|-------|------|------|---------|
| Auth | | | | |
| Dashboard | | | | |
| Wallet | | | | |
| Deposits | | | | |
| Withdrawals | | | | |
| Investments | | | | |
| ROI | | | | |
| Reinvestments | | | | |
| Referrals | | | | |
| Notifications | | | | |
| Admin | | | | |
| Migration | | | | |
| Reporting | | | | |
| Settings | | | | |
| Health | | | | |
| **Total** | | | | |

---

## Defect Log

| ID | Section | Description | Severity | Status |
|----|---------|-------------|----------|--------|
| | | | | |

**Severity:** Critical (blocks launch) / Major / Minor / Cosmetic

---

## Sign-Off

| Role | Name | Date | Approved |
|------|------|------|----------|
| QA | | | ☐ |
| Engineering | | | ☐ |
| Product/Ops | | | ☐ |

**Go-live recommendation:** ☐ Approved  ☐ Blocked — see defect log
