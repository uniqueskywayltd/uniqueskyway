#!/usr/bin/env bash
# Upload a locally-built Next.js app to Namecheap SHARED hosting via SFTP/rsync.
#
# 1. Build locally (never on shared hosting — not enough RAM):
#      npm run build:cpanel
# 2. Upload:
#      CPANEL_USER=youruser CPANEL_HOST=server123.web-hosting.com \
#      REMOTE_PATH=/home/youruser/uniqueskyway npm run deploy:cpanel
#
# Get SFTP host from cPanel → FTP Accounts (often same as domain or server hostname).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CPANEL_USER="${CPANEL_USER:-}"
CPANEL_HOST="${CPANEL_HOST:-}"
REMOTE_PATH="${REMOTE_PATH:-}"
SSH_PORT="${SSH_PORT:-21098}"

if [[ -z "$CPANEL_USER" || -z "$CPANEL_HOST" || -z "$REMOTE_PATH" ]]; then
  cat <<'EOF'
Namecheap shared hosting upload

Required environment variables:
  CPANEL_USER   — cPanel username (FTP/SFTP)
  CPANEL_HOST   — SFTP hostname (from cPanel → FTP Accounts)
  REMOTE_PATH   — Node app root on server (NOT public_html)
                  Example: /home/youruser/uniqueskyway

Optional:
  SSH_PORT      — SFTP port (Namecheap often uses 21098, default 22)

Steps:
  1. npm run build:cpanel          # build on your Mac/PC
  2. Set env vars above
  3. npm run deploy:cpanel         # upload .next + app files

Then in cPanel → Setup Node.js App:
  - Application root: same as REMOTE_PATH
  - Startup file: server.cpanel.js
  - Run NPM Install → Start App

See NAMECHEAP_SHARED_HOSTING.md
EOF
  exit 1
fi

if [[ ! -d ".next" ]]; then
  echo "ERROR: Missing .next folder — run: npm run build:cpanel" >&2
  exit 1
fi

RSYNC_SSH="ssh -p ${SSH_PORT}"
RSYNC_TARGET="${CPANEL_USER}@${CPANEL_HOST}:${REMOTE_PATH}/"

echo "==> Uploading to ${RSYNC_TARGET} (port ${SSH_PORT})..."

rsync -avz --delete -e "$RSYNC_SSH" \
  --exclude node_modules \
  --exclude .git \
  --exclude .env.local \
  --exclude .env.production.local \
  .next/ "${RSYNC_TARGET}.next/"

rsync -avz -e "$RSYNC_SSH" \
  public/ "${RSYNC_TARGET}public/" \
  server.cpanel.js package.json package-lock.json next.config.ts \
  "${RSYNC_TARGET}"

echo ""
echo "==> Upload complete."
echo "In cPanel: Setup Node.js App → Stop → Run NPM Install → Start App"
echo "Smoke test: npm run deploy:smoke -- https://uniqueskyway.com"
