#!/usr/bin/env bash
# Loads production env and starts the Next.js standalone server (PM2/systemd).
set -euo pipefail

APP_ROOT="${APP_ROOT:-$(pwd)}"
SHARED_ROOT="${SHARED_ROOT:-$(cd "$(dirname "$0")/.." && pwd)/shared}"
ENV_FILE="${ENV_FILE:-${SHARED_ROOT}/.env.production}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  echo "WARN: Missing $ENV_FILE — using existing environment." >&2
fi

cd "$APP_ROOT"
exec node server.js
