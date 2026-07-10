#!/usr/bin/env bash
# Sync production secrets to the uniqueskyway Vercel project from Supabase CLI.
set -euo pipefail

PROJECT_REF="cdgvfhqyctnbvnykodek"
REGION="eu-west-1"
APP_URL="https://uniqueskyway.com"
VERCEL_PROJECT="uniqueskyway"

cd "$(dirname "$0")/.."

vercel link --project "$VERCEL_PROJECT" --yes >/dev/null 2>&1 || true

echo "→ Fetching Supabase API keys..."
KEYS_JSON=$(supabase projects api-keys --project-ref "$PROJECT_REF" -o json)
ANON_KEY=$(python3 -c "import json,sys; d=json.load(sys.stdin); print(next(x['api_key'] for x in d if x.get('name')=='anon'))" <<<"$KEYS_JSON")
SERVICE_KEY=$(python3 -c "import json,sys; d=json.load(sys.stdin); print(next(x['api_key'] for x in d if x.get('name')=='service_role'))" <<<"$KEYS_JSON")
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  SUPABASE_ACCESS_TOKEN=$(node scripts/extract-supabase-pat.mjs 2>/dev/null || true)
fi

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "→ Using provided DATABASE_URL"
elif [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
  DATABASE_URL="postgresql://postgres.${PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-0-${REGION}.pooler.supabase.com:6543/postgres"
  echo "→ Built DATABASE_URL from SUPABASE_DB_PASSWORD"
elif [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "→ Resetting database password via Supabase Management API..."
  DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
  HTTP_CODE=$(curl -sS -o /tmp/supabase-pw-reset.json -w "%{http_code}" \
    -X PATCH "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/password" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"password\":\"${DB_PASSWORD}\"}")
  if [[ "$HTTP_CODE" != "200" && "$HTTP_CODE" != "201" ]]; then
    echo "Failed to reset database password (HTTP ${HTTP_CODE})"
    cat /tmp/supabase-pw-reset.json
    exit 1
  fi
  DATABASE_URL="postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-${REGION}.pooler.supabase.com:6543/postgres"
else
  echo "ERROR: Could not resolve DATABASE_URL. Set DATABASE_URL, SUPABASE_DB_PASSWORD, or run supabase login."
  exit 1
fi

CRON_SECRET=${CRON_SECRET:-$(openssl rand -hex 32)}
SITE_ACCESS_KEY=${SITE_ACCESS_KEY:-$(openssl rand -hex 32)}

set_env() {
  local name="$1"
  local value="$2"
  local env_target="${3:-production}"
  vercel env rm "$name" "$env_target" --yes 2>/dev/null || true
  printf '%s' "$value" | vercel env add "$name" "$env_target" --yes >/dev/null
  echo "  ✓ ${name} (${env_target})"
}

echo "→ Updating Vercel project: ${VERCEL_PROJECT}"
for target in production preview; do
  set_env "NEXT_PUBLIC_APP_URL" "$APP_URL" "$target"
  set_env "NEXT_PUBLIC_APP_NAME" "Unique Sky Way" "$target"
  set_env "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "$target"
  set_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$ANON_KEY" "$target"
  set_env "SUPABASE_SERVICE_ROLE_KEY" "$SERVICE_KEY" "$target"
  set_env "DATABASE_URL" "$DATABASE_URL" "$target"
  set_env "CRON_SECRET" "$CRON_SECRET" "$target"
  set_env "EMAIL_FROM" "Unique Sky Way <info@uniqueskyway.com>" "$target"
done

set_env "SITE_ACCESS_KEY" "$SITE_ACCESS_KEY" production
set_env "MAINTENANCE_MODE" "false" production

if [[ -n "${RESEND_API_KEY:-}" ]]; then
  set_env "RESEND_API_KEY" "$RESEND_API_KEY" production
  set_env "RESEND_API_KEY" "$RESEND_API_KEY" preview
else
  echo "  ⚠ RESEND_API_KEY not set — add in Vercel for email delivery"
fi

echo "→ Verifying database connection..."
node -e "
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
sql\`select 1 as ok\`.then(r => { console.log('  ✓ Database reachable'); return sql.end(); }).catch(e => { console.error('  ✗ Database connection failed:', e.message); process.exit(1); });
" 

echo "→ Done. Deploy with: vercel deploy --prod"
