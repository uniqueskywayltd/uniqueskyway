# Unique Sky Way Platform

Modern investment and financial services platform rebuilt on Next.js 16, Supabase, and Vercel.

**Status:** Feature-complete v1.0 — staging validation and production deployment pending.

---

## Quick Start

```bash
cd platform
cp .env.example .env.local
# Fill in Supabase credentials and DATABASE_URL

npm install
npm run db:migrate      # Apply migrations 0000–0013
npm run db:verify       # Verify infrastructure
npm run bootstrap:admin -- --email=admin@example.com --password=SecurePass123 --name="Super Admin"

npm run dev             # http://localhost:3000
```

---

## Quality Gates

```bash
npm run type-check   # TypeScript
npm run lint         # ESLint
npm run build        # Production build
```

---

## Key Scripts

| Script | Purpose |
|--------|---------|
| `npm run db:migrate` | Apply SQL migrations |
| `npm run db:verify` | Infrastructure verification |
| `npm run db:seed` | Re-seed system data |
| `npm run bootstrap:admin` | Create Super Admin |
| `npm run migration:dry-run` | Legacy migration validation |

---

## Documentation

| Document | Audience |
|----------|----------|
| [FINAL_HANDOVER.md](./FINAL_HANDOVER.md) | **Start here** — complete handover index |
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | Engineers |
| [CLIENT_ADMIN_GUIDE.md](./CLIENT_ADMIN_GUIDE.md) | Operations staff |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Launch coordination |
| [TEST_PLAN.md](./TEST_PLAN.md) | QA validation |
| [STAGING_SIGNOFF.md](./STAGING_SIGNOFF.md) | Sign-off record |

---

## Stack

Next.js 16 · React 19 · Drizzle ORM · Supabase · Resend · Vercel · Tailwind CSS 4 · shadcn/ui

---

## License

Proprietary — Unique Sky Way. All rights reserved.
