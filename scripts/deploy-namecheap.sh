#!/usr/bin/env bash
# Build and optionally rsync the standalone bundle to a Namecheap VPS.
#
# Required env (or pass as arguments):
#   DEPLOY_HOST   — SSH host (e.g. root@123.45.67.89)
#   DEPLOY_PATH   — Remote app directory (e.g. /var/www/uniqueskyway)
#
# Example:
#   DEPLOY_HOST=root@your-vps-ip DEPLOY_PATH=/var/www/uniqueskyway npm run deploy:namecheap
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DEPLOY_HOST="${DEPLOY_HOST:-${1:-}}"
DEPLOY_PATH="${DEPLOY_PATH:-${2:-/var/www/uniqueskyway}}"
GIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo local)"
GIT_REF="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"

echo "==> Building production bundle..."
export NODE_ENV=production
export GIT_COMMIT_SHA="$GIT_SHA"
export GIT_COMMIT_REF="$GIT_REF"
export DEPLOYMENT_ID="namecheap-${GIT_SHA}-$(date +%Y%m%d%H%M)"

npm ci
npm run build
node scripts/prepare-standalone.mjs

RELEASE_DIR=".next/standalone"
if [[ ! -f "$RELEASE_DIR/server.js" ]]; then
  echo "ERROR: $RELEASE_DIR/server.js not found after build." >&2
  exit 1
fi

echo "==> Build complete ($GIT_SHA)"

if [[ -z "$DEPLOY_HOST" ]]; then
  echo ""
  echo "Local build only. To upload to Namecheap VPS, set DEPLOY_HOST:"
  echo "  DEPLOY_HOST=root@YOUR_VPS_IP DEPLOY_PATH=$DEPLOY_PATH npm run deploy:namecheap"
  echo ""
  echo "On the server after first upload, see deploy/NAMECHEAP_SERVER_SETUP.md"
  exit 0
fi

echo "==> Uploading to ${DEPLOY_HOST}:${DEPLOY_PATH} ..."
ssh "$DEPLOY_HOST" "mkdir -p '${DEPLOY_PATH}/releases' '${DEPLOY_PATH}/shared/scripts' '${DEPLOY_PATH}/shared/logs' '${DEPLOY_PATH}/deploy'"
REMOTE_RELEASE="${DEPLOY_PATH}/releases/${DEPLOYMENT_ID}"

rsync -az --delete \
  --exclude node_modules \
  "$RELEASE_DIR/" "${DEPLOY_HOST}:${REMOTE_RELEASE}/"

rsync -az deploy/ "${DEPLOY_HOST}:${DEPLOY_PATH}/deploy/"
rsync -az scripts/cron-hit.sh "${DEPLOY_HOST}:${DEPLOY_PATH}/shared/scripts/"

ssh "$DEPLOY_HOST" bash -s <<EOF
set -euo pipefail
mkdir -p "${DEPLOY_PATH}/shared/logs"
cp -f "${DEPLOY_PATH}/deploy/crontab.example" "${DEPLOY_PATH}/shared/crontab.example" 2>/dev/null || true
cp -f "${DEPLOY_PATH}/deploy/env.production.template" "${DEPLOY_PATH}/shared/env.production.template" 2>/dev/null || true
cp -f scripts/cron-hit.sh "${DEPLOY_PATH}/shared/scripts/cron-hit.sh" 2>/dev/null || mkdir -p "${DEPLOY_PATH}/shared/scripts" && cp scripts/cron-hit.sh "${DEPLOY_PATH}/shared/scripts/cron-hit.sh"
chmod +x "${DEPLOY_PATH}/shared/scripts/cron-hit.sh" "${DEPLOY_PATH}/deploy/start.sh" 2>/dev/null || true
ln -sfn "${REMOTE_RELEASE}" "${DEPLOY_PATH}/current"
cd "${DEPLOY_PATH}"
export APP_ROOT="${DEPLOY_PATH}/current"
export SHARED_ROOT="${DEPLOY_PATH}/shared"
if command -v pm2 >/dev/null 2>&1; then
  pm2 reload deploy/ecosystem.config.cjs --update-env 2>/dev/null || pm2 start deploy/ecosystem.config.cjs
  pm2 save
else
  echo "PM2 not installed — see deploy/NAMECHEAP_SERVER_SETUP.md"
fi
EOF

echo "==> Deploy uploaded. Run smoke tests:"
echo "  npm run deploy:smoke -- https://uniqueskyway.com"
