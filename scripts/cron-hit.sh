#!/usr/bin/env bash
# Hit a protected cron endpoint from the server crontab.
# Usage: bash scripts/cron-hit.sh /api/cron/roi
set -euo pipefail

ENDPOINT="${1:-}"
BASE_URL="${APP_URL:-${NEXT_PUBLIC_APP_URL:-https://uniqueskyway.com}}"
CRON_SECRET="${CRON_SECRET:?Set CRON_SECRET in environment or .env.production}"

if [[ -z "$ENDPOINT" ]]; then
  echo "Usage: $0 /api/cron/roi" >&2
  exit 1
fi

curl -fsS -X POST \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "User-Agent: UniqueSkyWay-Cron/1.0" \
  "${BASE_URL}${ENDPOINT}" \
  -o "/tmp/cron-$(basename "$ENDPOINT").json" \
  -w "HTTP %{http_code}\n"
