#!/usr/bin/env bash
# One-time helper: list Vercel env var NAMES to copy into Namecheap .env.production.
# Does not print secret values — use Vercel dashboard → Settings → Environment Variables.
set -euo pipefail

cat <<'EOF'
Copy these from Vercel Production → Namecheap VPS shared/.env.production
======================================================================

REQUIRED (copy values from Vercel dashboard):
  NEXT_PUBLIC_APP_URL=https://uniqueskyway.com
  NEXT_PUBLIC_APP_NAME=Unique Sky Way
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  DATABASE_URL=
  RESEND_API_KEY=
  EMAIL_FROM=
  CRON_SECRET=

OPTIONAL:
  SITE_ACCESS_KEY=
  MAINTENANCE_MODE=false
  REGISTRATIONS_ENABLED=true

SELF-HOSTED (set on Namecheap server):
  NODE_ENV=production
  PORT=3000
  HOSTNAME=127.0.0.1

After migration, remove Vercel-specific vars — they are no longer used.

Supabase Auth redirect URLs (Supabase Dashboard → Authentication → URL config):
  Site URL: https://uniqueskyway.com
  Redirect URLs: https://uniqueskyway.com/auth/callback

EOF
