# Known Limitations — v1.0

Accepted limitations at release. These are documented trade-offs, not defects requiring immediate fix before staging validation.

---

## Infrastructure & Scale

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **In-memory rate limiting** | Resets on cold start; not shared across Vercel instances | Sufficient for launch traffic; migrate to Redis/Upstash if scaling beyond single-region |
| **No external APM** | No Datadog/New Relic integration | Vercel log drain + Supabase metrics + `/api/health` |
| **No email bounce webhooks** | Bounces not auto-processed in-app | Monitor Resend dashboard manually |
| **Single Postgres region** | Latency for distant users | Supabase region selection at project creation |

---

## Features Deferred (Not in v1.0 Scope)

| Item | Status | Notes |
|------|--------|-------|
| Wallet CSV/PDF export | Disabled button on wallet page | Ledger data available via API; export is UI convenience |
| Contact form backend | Client-side confirmation only | Submissions do not create tickets or send email; directs users to `info@uniqueskyway.com` |
| Push notifications | Not implemented | In-app + email only |
| Mobile native apps | Not implemented | Responsive web app |
| Multi-currency live conversion | USD primary | `preferred_currency` stored; conversion rates not automated |
| KYC document review workflow | Storage exists | Manual admin review outside automated workflow |
| Two-factor authentication | Not implemented | Supabase MFA can be added in future release |
| Marketing email campaigns | Broadcast only | Admin broadcast notification; no drip campaigns |

---

## Migration

| Limitation | Impact | Resolution |
|------------|--------|------------|
| **Duplicate username `Salman26`** | Blocks live migration | Resolve in legacy data before cutover |
| **~330 orphan transactions** | Warning-level in dry-run | Review in migration report; may be system/test accounts |
| **Legacy password hashes** | Not portable | All migrated users receive password reset email |
| **Avatar coverage** | Depends on `u_images/` availability | Missing images fall back to initials |

---

## Security

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **Privacy shield is not authentication** | Shared access key grants site visibility | Remove `SITE_ACCESS_KEY` when going fully public |
| **Cron secret in query param** | Visible in access logs if used | Prefer `Authorization: Bearer` header |
| **Admin session same Supabase Auth** | Shared auth infrastructure | Separate admin login route + RBAC enforcement |

---

## Accessibility

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **No formal WCAG audit** | Baseline shadcn/ui accessibility | Keyboard nav works; manual audit recommended pre-public launch |
| **Carousel auto-advance (testimonials)** | May affect motion-sensitive users | No `prefers-reduced-motion` override yet |
| **Chart color-only indicators** | Admin charts may rely on color | Labels present on data tables |

---

## Performance

| Limitation | Impact | Notes |
|------------|--------|-------|
| **Dashboard bundle ~1 MB uncompressed** | First load on slow connections | Shared chunks cached; gzip ~70% reduction |
| **No CDN for API routes** | API latency varies by region | Vercel edge for static; API on serverless |
| **Legacy brand images ~500px** | Some marketing images upscaled | Acceptable at current viewport sizes; higher-res assets optional |

---

## Operational

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **CLI auth separate from browser** | `gh`, `supabase` CLI require terminal login | Document in OPEN_ITEMS.md |
| **No automated backup verification** | Supabase handles backups | Confirm backup retention in Supabase dashboard |
| **Feature flags require admin access** | No env-var override for all flags | Use `/admin/feature-flags` or direct DB |

---

## Documentation

These limitations are intentional v1.0 scope boundaries. Future enhancements are listed separately in `OPEN_ITEMS.md` under "Future Enhancement Opportunities" and must not block production launch if staging validation passes.
