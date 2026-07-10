# Namecheap SHARED hosting — cPanel + Node.js + Git

This is the correct guide for **Namecheap Stellar / shared hosting** with:

- **Setup Node.js App** (Phusion Passenger)
- **Git Version Control** in cPanel

> VPS instructions are in [NAMECHEAP_MIGRATION.md](./NAMECHEAP_MIGRATION.md) — only use those if you upgrade to VPS later.

---

## Before you start — honest expectations

This app is a **full Next.js 16** platform (SSR, API routes, admin portal, auth, cron). Shared hosting works but:

- **Build on your computer only** — the server will run out of memory if you `npm run build` there
- **Node 20+ required** — check cPanel → Setup Node.js App → version dropdown (Next.js 16 needs Node 20.9+)
- **Performance** may be slower than Vercel/VPS under load
- **Supabase + Resend** stay external (same as today)

If Node 20 is not available on your plan, contact Namecheap support or upgrade to VPS.

---

## Architecture on shared hosting

```
Browser → cPanel domain → .htaccess → Phusion Passenger → server.cpanel.js → Next.js
                                                              ↓
                                                    Supabase / Resend (cloud)
```

Cron jobs: **cPanel Cron Jobs** → `curl` your `/api/cron/*` URLs (see `deploy/cpanel-cron-jobs.txt`).

---

## Step 1 — Export secrets from Vercel

```bash
cd platform
bash scripts/export-vercel-env-checklist.sh
```

Copy every Production value from Vercel dashboard.

---

## Step 2 — Git repository in cPanel

1. cPanel → **Git Version Control** → **Create**
2. Clone your repository (GitHub URL + deploy key if private)
3. Repository path example: `/home/youruser/uniqueskyway`
4. **Do not** put the app inside `public_html` — use a folder **outside** `public_html` for the Node app root

The repo includes `.cpanel.yml` for post-pull hooks (installs deps only — **no build on server**).

---

## Step 3 — Create the Node.js app in cPanel

1. cPanel → **Setup Node.js App** → **Create Application**
2. Settings:

| Field | Value |
|-------|--------|
| Node.js version | **20.x** (highest available) |
| Application mode | Production |
| Application root | `/home/youruser/uniqueskyway` (your git clone path) |
| Application URL | `uniqueskyway.com` (or subdomain while testing) |
| Application startup file | `server.cpanel.js` |

3. **Environment variables** — add every var from `deploy/env.production.template`:

```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://uniqueskyway.com
NEXT_PUBLIC_APP_NAME=Unique Sky Way
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
RESEND_API_KEY=...
EMAIL_FROM=...
CRON_SECRET=...
```

4. Click **Create** (do not start yet — no build uploaded)

---

## Step 4 — Build locally & upload

On your Mac/PC:

```bash
cd platform
npm ci
npm run build:cpanel
```

Upload to the server (SFTP). Namecheap SFTP port is often **21098**:

```bash
CPANEL_USER=your_cpanel_user \
CPANEL_HOST=serverXXX.web-hosting.com \
REMOTE_PATH=/home/your_cpanel_user/uniqueskyway \
SSH_PORT=21098 \
npm run deploy:cpanel
```

This uploads:

- `.next/` (production build)
- `public/`
- `server.cpanel.js`, `package.json`, `next.config.ts`

---

## Step 5 — Install dependencies & start

Back in cPanel → **Setup Node.js App**:

1. **Stop** the app
2. **Run NPM Install** (installs production `node_modules` on server)
3. **Start App**

cPanel creates `.htaccess` in `public_html` that proxies traffic to Passenger.

Open `https://uniqueskyway.com` — you should see the site.

---

## Step 6 — Cron jobs (replaces Vercel Cron)

cPanel → **Cron Jobs** → add the two jobs from `deploy/cpanel-cron-jobs.txt`.

Use your real `CRON_SECRET` in the curl command.

Test manually:

```bash
curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://uniqueskyway.com/api/cron/roi
```

---

## Step 7 — Supabase auth URLs

Supabase Dashboard → Authentication → URL Configuration:

- **Site URL:** `https://uniqueskyway.com`
- **Redirect URLs:** `https://uniqueskyway.com/auth/callback`

---

## Step 8 — DNS cutover (leave Vercel)

When shared hosting works:

1. Namecheap DNS → point `@` and `www` to your **shared hosting** (usually automatic if domain + hosting on same account)
2. Remove domain from Vercel project
3. Smoke test: `npm run deploy:smoke -- https://uniqueskyway.com`

---

## Ongoing workflow (Git + manual build upload)

Because `.next` is not in git:

```
1. Code changes → git push
2. cPanel Git → Pull or Deploy (updates source)
3. Local: npm run build:cpanel
4. Local: npm run deploy:cpanel  (upload .next)
5. cPanel → Restart Node.js app
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 503 / Application error | cPanel → Node.js app → check error log; verify `server.cpanel.js` path |
| Blank page | `.next` not uploaded — run `deploy:cpanel` after build |
| npm install fails | Node version too old; upgrade in cPanel dropdown |
| Build OOM locally | Close other apps; `NODE_OPTIONS=--max-old-space-size=4096 npm run build:cpanel` |
| Auth redirect errors | Match `NEXT_PUBLIC_APP_URL` in cPanel env + Supabase URLs |
| Slow site | Expected on shared hosting; consider VPS upgrade |

---

## Files reference

| File | Purpose |
|------|---------|
| `server.cpanel.js` | Passenger startup (required) |
| `npm run build:cpanel` | Local production build |
| `npm run deploy:cpanel` | SFTP upload of build |
| `.cpanel.yml` | Git post-pull hook |
| `deploy/cpanel-cron-jobs.txt` | cPanel cron templates |
| `deploy/env.production.template` | Env var checklist |

---

## Upgrade path

If shared hosting is too slow or Node 20 unavailable → **Namecheap VPS** + [deploy/NAMECHEAP_SERVER_SETUP.md](./deploy/NAMECHEAP_SERVER_SETUP.md)
