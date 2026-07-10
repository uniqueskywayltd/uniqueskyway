#!/usr/bin/env bash
set -euo pipefail

OFFICIAL_PROJECT="uniqueskyway"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_FILE="$ROOT/.vercel/project.json"

if [[ ! -f "$PROJECT_FILE" ]]; then
  echo "ERROR: Not linked to Vercel. Run: vercel link --project $OFFICIAL_PROJECT --yes"
  exit 1
fi

LINKED=$(node -e "const p=require('$PROJECT_FILE'); process.stdout.write(p.projectName||'')")

if [[ "$LINKED" != "$OFFICIAL_PROJECT" ]]; then
  echo "ERROR: Linked to '$LINKED' but official project is '$OFFICIAL_PROJECT'."
  echo "Run: vercel link --project $OFFICIAL_PROJECT --yes"
  exit 1
fi

echo "OK: linked to $OFFICIAL_PROJECT"
