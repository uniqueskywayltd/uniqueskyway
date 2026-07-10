# Migration: Vercel → Namecheap Hosting

Choose your hosting type:

| Your plan | Guide |
|-----------|--------|
| **Shared hosting** (cPanel, Node.js, Git) | **[NAMECHEAP_SHARED_HOSTING.md](./NAMECHEAP_SHARED_HOSTING.md)** ← start here |
| **VPS** (root SSH, PM2, Nginx) | [deploy/NAMECHEAP_SERVER_SETUP.md](./deploy/NAMECHEAP_SERVER_SETUP.md) |

This file covers the **VPS** path. Shared hosting uses cPanel Passenger + `server.cpanel.js` instead.

---

## VPS path (Namecheap VPS only)

Moves **Unique Sky Way** from Vercel to a **Namecheap VPS** while keeping **Supabase** (database, auth, storage) and **Resend** (email) unchanged.

> **Shared/cPanel hosting:** use [NAMECHEAP_SHARED_HOSTING.md](./NAMECHEAP_SHARED_HOSTING.md) — do not follow VPS steps below.

---

## What stays the same

| Service | Role |
|---------|------|
| **Supabase** | Postgres, Auth, Storage |
| **Resend** | Transactional email |
| **Domain** | `uniqueskyway.com` (DNS moves to VPS IP) |

## What changes

| Before (Vercel) | After (Namecheap VPS) |
|-----------------|------------------------|
| `vercel deploy` | `npm run deploy:namecheap` |
| Vercel Cron (`vercel.json`) | Server `crontab` (`deploy/crontab.example`) |
| Vercel env vars | `/var/www/uniqueskyway/shared/.env.production` |
| Edge/serverless functions | Node.js standalone (`output: 'standalone'`) |
| Auto SSL via Vercel | Let's Encrypt via Certbot + Nginx |

---

## Pre-migration checklist

### 1. Export environment variables from Vercel

In Vercel → Project → Settings → Environment Variables → **Production**, copy every value.

Local helper (lists names only):

```bash
cd platform
bash scripts/export-vercel-env-checklist.sh
```

Required variables — see `deploy/env.production.template`.

### 2. Provision Namecheap VPS

- **Recommended:** Pulsar VPS or higher (2+ GB RAM, Ubuntu 22.04)
- Note the **public IP address**
- Enable SSH key login

Follow: [deploy/NAMECHEAP_SERVER_SETUP.md](./deploy/NAMECHEAP_SERVER_SETUP.md)

### 3. Lower DNS TTL (24–48 hours before cutover)

In Namecheap Advanced DNS for `uniqueskyway.com`:

- Set TTL to **300 seconds** (5 min) on `@` and `www` records

---

## Migration steps

### Phase A — Build & deploy to VPS (Vercel still live)

1. Complete server setup (`NAMECHEAP_SERVER_SETUP.md`)
2. Create `/var/www/uniqueskyway/shared/.env.production` with all secrets
3. Deploy from your machine:

```bash
cd platform
npm run build:namecheap          # local test build
DEPLOY_HOST=root@YOUR_VPS_IP DEPLOY_PATH=/var/www/uniqueskyway npm run deploy:namecheap
```

4. Test via VPS IP (temporary):

```bash
curl -H "Host: uniqueskyway.com" http://YOUR_VPS_IP/api/health
```

Or add a hosts file entry on your computer:

```
YOUR_VPS_IP uniqueskyway.com
```

5. Verify login, register, admin portal, deposits, and cron manually:

```bash
source /var/www/uniqueskyway/shared/.env.production
bash /var/www/uniqueskyway/shared/scripts/cron-hit.sh /api/cron/roi
```

### Phase B — DNS cutover

1. **Supabase Auth URLs** (Dashboard → Authentication → URL Configuration):
   - Site URL: `https://uniqueskyway.com`
   - Redirect URLs: `https://uniqueskyway.com/auth/callback`

2. **Namecheap DNS** — replace Vercel records:

| Type | Host | Value |
|------|------|-------|
| A | `@` | `YOUR_VPS_IP` |
| A | `www` | `YOUR_VPS_IP` |

Remove old Vercel `CNAME` / `A` records pointing to Vercel.

3. Wait for propagation (5–30 min with low TTL)

4. Confirm SSL:

```bash
curl -sI https://uniqueskyway.com | head -5
npm run deploy:smoke -- https://uniqueskyway.com
```

### Phase C — Decommission Vercel

After 24–48 hours of stable VPS operation:

1. Disable Vercel crons (delete project or remove domain from Vercel)
2. Remove domain from Vercel project settings
3. Archive `.vercel/` locally (no longer used)
4. Update team docs to use Namecheap deploy commands

---

## Deploy commands (ongoing)

| Command | Purpose |
|---------|---------|
| `npm run build:namecheap` | Production build + standalone bundle |
| `npm run deploy:namecheap` | Build and rsync to VPS (set `DEPLOY_HOST`) |
| `npm run deploy:smoke` | Post-deploy health checks |
| `bash scripts/cron-hit.sh /api/cron/roi` | Manual cron test |

---

## Cron schedule (server crontab)

| Job | Path | Schedule |
|-----|------|----------|
| ROI accrual | `/api/cron/roi` | `0 6 * * *` (06:00 UTC daily) |
| Email queue | `/api/cron/notifications` | `*/15 * * * *` (every 15 min) |

Template: `deploy/crontab.example`

---

## File reference

```
platform/
├── deploy/
│   ├── NAMECHEAP_SERVER_SETUP.md   ← VPS first-time setup
│   ├── nginx-uniqueskyway.conf     ← Reverse proxy
│   ├── ecosystem.config.cjs        ← PM2 config
│   ├── uniqueskyway.service        ← systemd alternative
│   ├── crontab.example             ← Scheduled jobs
│   ├── env.production.template     ← Env file template
│   └── start.sh                    ← Loads .env + starts server
├── scripts/
│   ├── deploy-namecheap.sh         ← Build + upload
│   ├── prepare-standalone.mjs      ← Copies static assets
│   ├── cron-hit.sh                 ← Cron HTTP caller
│   └── export-vercel-env-checklist.sh
└── NAMECHEAP_MIGRATION.md          ← This file
```

---

## Rollback plan

If VPS cutover fails:

1. Restore DNS A records to Vercel
2. Redeploy on Vercel: `vercel deploy --prod` (while project still exists)
3. Investigate VPS logs: `pm2 logs uniqueskyway`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 502 Bad Gateway | `pm2 status` — app not running; check `shared/logs/pm2-error.log` |
| Auth redirect loop | Supabase Site URL must match `NEXT_PUBLIC_APP_URL` |
| Cron not running | `crontab -l`; test `cron-hit.sh` manually |
| Missing images/CSS | Re-run `node scripts/prepare-standalone.mjs` after build |
| Out of memory | Upgrade VPS RAM or set `max_memory_restart` in PM2 |

---

## Support contacts

- **Namecheap VPS:** https://www.namecheap.com/support/
- **Supabase:** Dashboard → Support
- **Resend:** DNS/domain verification in Resend dashboard (unchanged)
