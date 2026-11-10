#!/usr/bin/env bash
# Puts the website on Cloudflare. Run it in the Codespace terminal:  pnpm go-live
# Safe to run again (to publish updates): it reuses the passwords it made the first time.
#   pnpm go-live --turnstile   adds the spam-protection keys and republishes
set -euo pipefail
cd "$(dirname "$0")/.."
export CLOUDFLARE_ENV=

say() { printf '\n\033[1;33m==> %s\033[0m\n' "$1"; }
stop() { printf '\n\033[1;31m%s\033[0m\n' "$1"; exit 1; }
wr() { pnpm -s exec wrangler "$@"; }

WORKER=$(grep -m1 '"name"' wrangler.jsonc | sed -E 's/.*"name": *"([^"]+)".*/\1/')
BUCKET=$(grep -m1 '"bucket_name"' wrangler.jsonc | sed -E 's/.*"bucket_name": *"([^"]+)".*/\1/')
DATABASE=$(grep -m1 '"database_name"' wrangler.jsonc | sed -E 's/.*"database_name": *"([^"]+)".*/\1/')
SITE=$(grep -m1 '"SITE_URL"' wrangler.jsonc | sed -E 's/.*"SITE_URL": *"([^"]+)".*/\1/')
SECRETS=.secrets/production.env

# ---------------------------------------------------------------- 1. Sign in to Cloudflare
if ! wr whoami 2>/dev/null | grep "You are logged in" >/dev/null; then
  say "Sign in to Cloudflare"
  if [ -n "${CODESPACES:-}" ]; then
    # In a Codespace, Cloudflare's sign-in page sends you back to "localhost", which is your own
    # computer, not the Codespace. So we pass that address to the Codespace ourselves.
    LOG=$(mktemp)
    wr login --browser=false >"$LOG" 2>&1 &
    LOGIN_PID=$!
    for _ in $(seq 1 60); do grep -q "https://dash.cloudflare.com/oauth2/auth" "$LOG" && break; sleep 1; done
    URL=$(grep -o 'https://dash.cloudflare.com/oauth2/auth[^ ]*' "$LOG" | head -1)
    [ -n "$URL" ] || { cat "$LOG"; stop "Couldn't start the Cloudflare sign-in."; }
    cat <<MSG

  1. Open this link (Cmd-click it), sign in if asked, and click Allow:

     $URL

  2. Your browser will then show an error page ("can't connect" / "can't be reached").
     That's expected. Copy the whole address from the browser's address bar
     (it starts with http://localhost:8976) and paste it here, then press Enter.

MSG
    read -r -p "  Address: " CALLBACK
    case "$CALLBACK" in http://localhost:8976/*) ;; *) kill "$LOGIN_PID" 2>/dev/null; stop "That doesn't look like the localhost address. Run pnpm go-live again.";; esac
    curl -s "$CALLBACK" >/dev/null || true
    wait "$LOGIN_PID" || true
  else
    wr login
  fi
  wr whoami 2>/dev/null | grep "You are logged in" >/dev/null || stop "Sign-in didn't finish. Run pnpm go-live again."
fi
echo "Signed in to Cloudflare."

# ---------------------------------------------------------------- 2. Passwords
if [ ! -f "$SECRETS" ]; then
  # Never make new keys for a site that already has them: saved loan applications would become
  # unreadable. Restore the file from the password manager instead.
  if wr secret list --name "$WORKER" 2>/dev/null | grep FIELD_ENCRYPTION_KEY >/dev/null; then
    stop "This site is already live, but this Codespace doesn't have its passwords file ($SECRETS).
Recreate it from your password manager (same three lines: PAYLOAD_SECRET=, FIELD_ENCRYPTION_KEY=,
SETUP_CODE=) and run pnpm go-live again."
  fi
  say "Making the site's passwords"
  mkdir -p .secrets && chmod 700 .secrets
  umask 077
  {
    echo "PAYLOAD_SECRET=$(openssl rand -hex 32)"
    echo "FIELD_ENCRYPTION_KEY=$(openssl rand -base64 32)"
    echo "SETUP_CODE=$(openssl rand -hex 12)"
  } >"$SECRETS"
fi
set -a; source "$SECRETS"; set +a

if [ "${1:-}" = "--turnstile" ]; then
  say "Spam protection (Turnstile) keys"
  read -r -p "  Site key: " TS_SITE
  read -r -p "  Secret key: " TS_SECRET
  [ -n "$TS_SITE" ] && [ -n "$TS_SECRET" ] || stop "Both keys are needed."
  grep -v '^TURNSTILE_' "$SECRETS" >"$SECRETS.tmp" || true
  { echo "TURNSTILE_SITE_KEY=$TS_SITE"; echo "TURNSTILE_SECRET_KEY=$TS_SECRET"; } >>"$SECRETS.tmp"
  mv "$SECRETS.tmp" "$SECRETS"
  set -a; source "$SECRETS"; set +a
fi

# ---------------------------------------------------------------- 3. Storage
say "Checking the database and photo storage"
wr d1 list 2>/dev/null | grep "$DATABASE" >/dev/null || stop "No D1 database named $DATABASE in this Cloudflare account."
if ! wr r2 bucket list 2>/dev/null | grep "$BUCKET" >/dev/null; then
  wr r2 bucket create "$BUCKET" || stop "Couldn't create the R2 bucket $BUCKET. Turn on R2 in the Cloudflare dashboard, then run this again."
fi

# ---------------------------------------------------------------- 4. Database and catalog
# Runs a query on the live database and prints the rows as JSON ("?" if it couldn't).
live_rows() {
  wr d1 execute "$DATABASE" --remote --json --command "$1" 2>/dev/null | node -e '
    let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => {
      try { console.log(JSON.stringify(JSON.parse(s.slice(s.indexOf("[")))[0].results)) } catch { console.log("?") }
    })'
}
say "Checking the live database"
LIVE_TABLES=$(live_rows "SELECT name, sql FROM sqlite_master WHERE type = 'table'")
[ "$LIVE_TABLES" = "?" ] && stop "Couldn't read the live database. Run pnpm go-live again."
LIVE_USERS=0
if echo "$LIVE_TABLES" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.exit(JSON.parse(s).some(t=>t.name==="users")?0:1))'; then
  LIVE_USERS=$(live_rows "SELECT count(*) AS n FROM users" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s)[0].n)}catch{console.log("?")}})')
  [ "$LIVE_USERS" = "?" ] && stop "Couldn't read the live database. Run pnpm go-live again."
fi

if [ "$LIVE_USERS" = "0" ]; then
  # Nobody has finished the setup wizard, so there's nothing of the dealer's to lose. Build the
  # whole database here (fast) and replace the live one with it in a single import, instead of
  # thousands of slow round trips. Leftovers from any earlier attempt are dropped with it.
  say "Building the database and the Bad Boy catalog"
  SCRATCH=.go-live-db
  rm -rf "$SCRATCH"
  export WRANGLER_PERSIST_TO="$PWD/$SCRATCH" PAYLOAD_LOCAL_BINDINGS=true
  NODE_ENV=production pnpm payload migrate >/dev/null
  NODE_ENV=production ALLOW_PRODUCTION_SEED=true pnpm seed
  unset WRANGLER_PERSIST_TO PAYLOAD_LOCAL_BINDINGS
  echo "$LIVE_TABLES" >"$SCRATCH/live-tables.json"
  node --no-warnings scripts/export-catalog.mjs "$SCRATCH" "$SCRATCH/live-tables.json"

  say "Uploading the database to Cloudflare"
  wr d1 execute "$DATABASE" --remote --file "$SCRATCH/rebuild.sql" -y

  say "Uploading the photos"
  while IFS=$'\t' read -r TYPE LIST; do
    [ -n "$LIST" ] && wr r2 bulk put "$BUCKET" --filename "$LIST" --remote --ct "$TYPE"
  done <"$SCRATCH/photo-lists.tsv"
  rm -rf "$SCRATCH"
else
  # A live site: only apply any new database changes. The dealer's catalog and pages stay as they are.
  say "Updating the database tables"
  pnpm run deploy:database
fi

# ---------------------------------------------------------------- 5. Build and publish
say "Building the website (about 5 minutes)"
# The build copies .env files into the website as fallback settings. The Codespace's .env holds
# demo-only keys (test spam keys, a local encryption key), so it's set aside during the build.
restore_env() { for f in .env .env.local .env.production; do [ -f "$f.go-live-aside" ] && mv "$f.go-live-aside" "$f"; done; return 0; }
trap restore_env EXIT
for f in .env .env.local .env.production; do [ -f "$f" ] && mv "$f" "$f.go-live-aside"; done
pnpm exec opennextjs-cloudflare build
restore_env

say "Publishing to Cloudflare"
pnpm exec opennextjs-cloudflare deploy

say "Saving the passwords on Cloudflare"
# Passwords already on Cloudflare are never replaced (a different FIELD_ENCRYPTION_KEY would lock
# every saved loan application). Only --turnstile updates the Turnstile keys.
EXISTING=$(wr secret list --name "$WORKER" --format json 2>/dev/null || echo "[]")
JSON=$(mktemp)
EXISTING="$EXISTING" TURNSTILE_UPDATE="${1:-}" node -e '
  let have = []; try { const s = process.env.EXISTING; have = JSON.parse(s.slice(s.indexOf("["))).map((x) => x.name) } catch {}
  const keys = ["PAYLOAD_SECRET","FIELD_ENCRYPTION_KEY","SETUP_CODE","TURNSTILE_SITE_KEY","TURNSTILE_SECRET_KEY"];
  const out = {};
  for (const k of keys) {
    if (!process.env[k]) continue;
    const replaceable = k.startsWith("TURNSTILE_") && process.env.TURNSTILE_UPDATE === "--turnstile";
    if (have.includes(k) && !replaceable) continue;
    out[k] = process.env[k];
  }
  process.stdout.write(JSON.stringify(out));
' >"$JSON"
if [ "$(cat "$JSON")" != "{}" ]; then wr secret bulk "$JSON" --name "$WORKER"; else echo "Already saved."; fi
rm -f "$JSON"

# ---------------------------------------------------------------- Done
cat <<MSG

$(printf '\033[1;32m')The website is live:$(printf '\033[0m') $SITE

  Open it and the setup wizard starts. It asks for this setup code:

      $SETUP_CODE

  SAVE THESE in your password manager now (copy all three lines):

      PAYLOAD_SECRET=$PAYLOAD_SECRET
      FIELD_ENCRYPTION_KEY=$FIELD_ENCRYPTION_KEY
      SETUP_CODE=$SETUP_CODE

  Without FIELD_ENCRYPTION_KEY, saved loan applications can never be opened.
MSG
if [ -z "${TURNSTILE_SECRET_KEY:-}" ]; then
  cat <<MSG

  Still to do: spam protection. Until it's on, the quote and financing forms won't send.
    1. Cloudflare dashboard → Turnstile → Add widget
    2. Name: Roanoke Mowers · Hostname: ${SITE#https://} · Mode: Managed → Create
    3. Run:  pnpm go-live --turnstile   and paste the two keys it shows you
MSG
fi
