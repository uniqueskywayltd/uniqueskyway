#!/usr/bin/env bash
# Post-deploy production smoke tests (no secrets printed).
set -euo pipefail

BASE_URL="${1:-https://uniqueskyway.com}"
ACCESS_KEY="${SITE_ACCESS_KEY:-}"
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

fail() { echo "FAIL: $1"; exit 1; }
ok() { echo "OK: $1"; }

# Health (exempt from access gate)
code=$(curl -sS -o /tmp/smoke_health.json -w "%{http_code}" "$BASE_URL/api/health")
[[ "$code" == "200" ]] || fail "health HTTP $code"
ok "GET /api/health → 200"

# Homepage
HOME_URL="$BASE_URL/"
if [[ -n "$ACCESS_KEY" ]]; then
  HOME_URL="$BASE_URL/?access=$ACCESS_KEY"
fi

code=$(curl -sS -o /tmp/smoke_home.html -w "%{http_code}" -A "$UA" -L "$HOME_URL")
[[ "$code" == "200" ]] || fail "homepage HTTP $code (access gate may block without SITE_ACCESS_KEY)"
grep -qi "<html" /tmp/smoke_home.html || fail "homepage missing HTML"
ok "GET / → $code"

# API route sample (browser UA — privacy shield blocks curl/bots)
code=$(curl -sS -o /dev/null -w "%{http_code}" -A "$UA" "$BASE_URL/api/settings/public")
[[ "$code" == "200" ]] || fail "settings/public HTTP $code"
ok "GET /api/settings/public → 200"

echo "All smoke checks passed."
