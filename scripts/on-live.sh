#!/usr/bin/env bash
# Runs a Payload script against a fresh copy of the LIVE database here, then applies only the rows
# it changed to the live site, plus any new uploaded files. Talking to the live database row by row
# is slow and its connection drops queries; this does the work locally and uploads one small patch.
#
#   bash scripts/on-live.sh src/seed/add-photos.ts gas-chainsaw gas-edger
#
# Needs Cloudflare access (CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID, or `wrangler login`) and
# the site's passwords in .secrets/production.env. Add --dry-run to stop before changing anything.
set -euo pipefail
cd "$(dirname "$0")/.."
export CLOUDFLARE_ENV=
DRY=false
ARGS=()
for a in "$@"; do if [ "$a" = "--dry-run" ]; then DRY=true; else ARGS+=("$a"); fi; done
[ ${#ARGS[@]} -gt 0 ] || { echo "Usage: bash scripts/on-live.sh <payload script> [args...] [--dry-run]"; exit 1; }

wr() { pnpm -s exec wrangler "$@"; }
DATABASE=$(grep -m1 '"database_name"' wrangler.jsonc | sed -E 's/.*"database_name": *"([^"]+)".*/\1/')
BUCKET=$(grep -m1 '"bucket_name"' wrangler.jsonc | sed -E 's/.*"bucket_name": *"([^"]+)".*/\1/')
WORK=.on-live
rm -rf "$WORK" && mkdir -p "$WORK"
[ -f .secrets/production.env ] && { set -a; source .secrets/production.env; set +a; }

echo "==> Copying the live database"
wr d1 export "$DATABASE" --remote --output "$WORK/live.sql"
# Create the local database file, then fill it straight from the export with foreign-key checks
# off (the export's table order doesn't always put parent tables first).
wr d1 execute "$DATABASE" --local --persist-to "$WORK/state" --command "SELECT 1" >/dev/null
DB=$(find "$WORK/state/v3/d1" -name '*.sqlite' ! -name metadata.sqlite)
node --no-warnings -e '
  const fs = require("node:fs"); const { DatabaseSync } = require("node:sqlite")
  const db = new DatabaseSync(process.argv[1])
  db.exec("PRAGMA foreign_keys = OFF")
  db.exec(fs.readFileSync(process.argv[2], "utf8").replace(/^PRAGMA defer_foreign_keys\s*=\s*\w+;?/gim, ""))
  const bad = db.prepare("PRAGMA foreign_key_check").all()
  if (bad.length) { console.error("The live database has broken links:", JSON.stringify(bad.slice(0, 5))); process.exit(1) }
' "$DB" "$WORK/live.sql"
cp "$DB" "$WORK/before.sqlite"

echo "==> Running ${ARGS[*]} on the copy"
WRANGLER_PERSIST_TO="$PWD/$WORK/state" PAYLOAD_LOCAL_BINDINGS=true NODE_ENV=production \
  pnpm payload run "${ARGS[@]}"
# Make sure everything is written into the main file before comparing.
node --no-warnings -e 'new (require("node:sqlite").DatabaseSync)(process.argv[1]).exec("PRAGMA wal_checkpoint(TRUNCATE)")' "$DB"

echo "==> Working out what changed"
node --no-warnings scripts/db-diff.mjs "$WORK/before.sqlite" "$DB" "$WORK/patch.sql"
NEW_FILES=$(node --no-warnings -e '
  const { DatabaseSync } = require("node:sqlite")
  const names = (f) => new Set(new DatabaseSync(f, { readOnly: true }).prepare("SELECT filename FROM media WHERE filename IS NOT NULL").all().map((r) => r.filename))
  const before = names(process.argv[1]); for (const n of names(process.argv[2])) if (!before.has(n)) console.log(n)
' "$WORK/before.sqlite" "$DB")
echo "New files: $(echo "$NEW_FILES" | grep -c . || true)"

if $DRY; then echo "Dry run: nothing changed on the live site. Patch: $WORK/patch.sql"; exit 0; fi

echo "==> Uploading new files"
for f in $NEW_FILES; do
  wr r2 object get "$BUCKET/$f" --local --persist-to "$WORK/state" --file "$WORK/$f" >/dev/null
  TYPE=$(node -p "({webp:'image/webp',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',avif:'image/avif',pdf:'application/pdf',csv:'text/csv'})['$f'.split('.').pop().toLowerCase()] || 'application/octet-stream'")
  wr r2 object put "$BUCKET/$f" --remote --file "$WORK/$f" --content-type "$TYPE" >/dev/null
  echo "  $f"
done

echo "==> Applying the changes to the live database"
wr d1 execute "$DATABASE" --remote --file "$WORK/patch.sql" -y
rm -rf "$WORK"
echo "Done."
