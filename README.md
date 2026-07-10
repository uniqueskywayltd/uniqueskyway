# Unique Sky Way Platform

Modern investment and financial services platform on Next.js 16, Supabase, and self-hosted Node (Namecheap VPS).

**Status:** Feature-complete v1.0 — production hosted on Namecheap VPS (migrated from Vercel).

---

## Quick Start

```bash
cd platform
cp .env.example .env.local
# Fill in Supabase credentials and DATABASE_URL

npm install
npm run db:migrate      # Apply migrations
npm run db:verify       # Verify infrastructure
npm run bootstrap:admin -- --email=admin@example.com --password=SecurePass123 --name="Super Admin"

npm run dev             # http://localhost:3000
```

---

## Production Deploy

### Shared hosting (cPanel + Git) — your setup

```bash
npm run build:cpanel
CPANEL_USER=you CPANEL_HOST=your-server.web-hosting.com REMOTE_PATH=/home/you/uniqueskyway npm run deploy:cpanel
```

**Full guide:** **[NAMECHEAP_SHARED_HOSTING.md](./NAMECHEAP_SHARED_HOSTING.md)**

### VPS (if you upgrade later)

```bash
DEPLOY_HOST=root@YOUR_VPS_IP npm run deploy:namecheap
```

See [NAMECHEAP_MIGRATION.md](./NAMECHEAP_MIGRATION.md)

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
| [NAMECHEAP_SHARED_HOSTING.md](./NAMECHEAP_SHARED_HOSTING.md) | **Shared hosting (cPanel + Git)** |
| [deploy/NAMECHEAP_SERVER_SETUP.md](./deploy/NAMECHEAP_SERVER_SETUP.md) | VPS first-time setup |
| [FINAL_HANDOVER.md](./FINAL_HANDOVER.md) | Complete handover index |
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | Engineers |
| [CLIENT_ADMIN_GUIDE.md](./CLIENT_ADMIN_GUIDE.md) | Operations staff |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Launch coordination |
| [TEST_PLAN.md](./TEST_PLAN.md) | QA validation |
| [STAGING_SIGNOFF.md](./STAGING_SIGNOFF.md) | Sign-off record |

---

## Stack

Next.js 16 · React 19 · Drizzle ORM · Supabase · Resend · Namecheap VPS · Tailwind CSS 4 · shadcn/ui

---

## License

Proprietary — Unique Sky Way. All rights reserved.
