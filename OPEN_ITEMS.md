# Open Items — Pre-Production & Post-Launch

Items requiring manual action before or after production deployment. Separated from production blockers where noted.

---

## Critical — Must Complete Before Production

| # | Item | Owner | Status |
|---|------|-------|--------|
| 1 | **Provide staging Supabase credentials** (`DATABASE_URL`, keys) | Client | ☐ Open |
| 2 | **Apply migrations 0000–0013** to staging Supabase | Engineering | ☐ Blocked on #1 |
| 3 | **Apply migrations 0000–0013** to production Supabase | Engineering | ☐ Blocked on staging sign-off |
| 4 | **Configure Resend** — verify domain, SPF/DKIM/DMARC | Client/Ops | ☐ Open |
| 5 | **Set Vercel production env vars** (see `.env.example`) | Engineering | ☐ Open |
| 6 | **Bootstrap Super Admin** on staging and production | Engineering | ☐ Blocked on #2 |
| 7 | **Execute TEST_PLAN.md** on staging; sign STAGING_SIGNOFF.md | QA/Ops | ☐ Blocked on #2 |
| 8 | **Resolve migration blocker:** duplicate username `Salman26` | Client/Data | ☐ Open |
| 9 | **Run live migration** on staging; verify balances | Engineering | ☐ Blocked on #8 |
| 10 | **GitHub CLI login** (`gh auth login`) for repo/CI access | Client | ☐ Open |
| 11 | **Supabase CLI login** (`supabase login`) for remote ops | Client | ☐ Open |

---

## High — Required for Go-Live

| # | Item | Owner | Status |
|---|------|-------|--------|
| 12 | Configure Cloudflare DNS → Vercel | Client/Ops | ☐ Open |
| 13 | SSL certificate verification (automatic via Vercel) | Ops | ☐ Open |
| 14 | Verify cron jobs fire on Vercel Pro | Engineering | ☐ Blocked on deploy |
| 15 | Send test transactional emails (register, deposit, withdrawal) | QA | ☐ Blocked on #4 |
| 16 | Finance sign-off on feature flag enablement sequence | Finance | ☐ Open |
| 17 | Execute CUTOVER_PLAN.md | All stakeholders | ☐ Blocked on #7 |
| 18 | Remove or rotate SITE_ACCESS_KEY when going public | Ops | ☐ Post-launch |

---

## Medium — Recommended Before Public Launch

| # | Item | Owner | Status |
|---|------|-------|--------|
| 19 | Replace default Next.js README.md content | Engineering | ☑ Done (see README) |
| 20 | Manual WCAG accessibility spot-check | QA | ☐ Open |
| 21 | Load test ROI cron with production-scale investment count | Engineering | ☐ Open |
| 22 | Confirm Supabase backup retention policy | Ops | ☐ Open |
| 23 | Set up Vercel log drain (optional) | Engineering | ☐ Open |
| 24 | Review orphan transaction warnings from migration dry-run | Finance | ☐ Open |
| 25 | Commit source code to client GitHub repository | Client/Engineering | ☐ Open (explicitly deferred) |

---

## Low — Post-Launch Enhancements

These are **not** production requirements. Do not implement before cutover unless explicitly approved.

| # | Enhancement | Priority |
|---|-------------|----------|
| L1 | Wallet CSV/PDF export | Low |
| L2 | Contact form → email/ticket integration | Low |
| L3 | Redis-backed rate limiting for multi-instance | Medium (if scaling) |
| L4 | Resend bounce/complaint webhooks | Low |
| L5 | External APM (Datadog, Sentry) | Medium |
| L6 | Two-factor authentication | Medium |
| L7 | `prefers-reduced-motion` for marketing animations | Low |
| L8 | Higher-resolution brand photography | Low |
| L9 | Transparent PNG logo variants for all contexts | Low |
| L10 | Mobile native apps | Future |

---

## CLI Authentication Status (Last Checked: 2026-07-05)

| Tool | Status |
|------|--------|
| Vercel CLI | Logged in as `alexjadenne-5307` |
| GitHub CLI | **Not logged in** — run `gh auth login` |
| Supabase CLI | **Not logged in** — run `supabase login` |

Browser login to GitHub/Supabase dashboards does **not** authenticate CLI tools.

---

## Credential Checklist

```
☐ NEXT_PUBLIC_SUPABASE_URL
☐ NEXT_PUBLIC_SUPABASE_ANON_KEY
☐ SUPABASE_SERVICE_ROLE_KEY
☐ DATABASE_URL (pooler, port 6543)
☐ RESEND_API_KEY
☐ EMAIL_FROM (verified domain)
☐ CRON_SECRET
☐ SITE_ACCESS_KEY (pre-launch)
☐ NEXT_PUBLIC_APP_URL
```

---

## Sign-Off Dependencies

Production deployment is blocked until:

1. `STAGING_SIGNOFF.md` — all critical tests marked Pass
2. Migration live run — zero balance discrepancies
3. `DEPLOYMENT_CHECKLIST.md` — 100% complete
4. No critical/high defects open
