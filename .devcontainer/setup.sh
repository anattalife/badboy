#!/usr/bin/env bash
# One-time setup for a new Codespace (or any fresh checkout).
# Installs dependencies, creates a local database and loads the Bad Boy catalog.
set -euo pipefail

echo "==> Installing pnpm"
npm install -g pnpm@10.28.0 >/dev/null

echo "==> Installing dependencies"
pnpm install --frozen-lockfile

# Local secrets. Each is added only if missing, so re-running keeps existing values.
touch .env
add_env() { grep -q "^$1=" .env || echo "$1=$2" >> .env; }
add_env PAYLOAD_SECRET "$(openssl rand -hex 32)"
add_env FIELD_ENCRYPTION_KEY "$(openssl rand -base64 32)"
# Cloudflare's official Turnstile *test* keys: the widget always passes and shows "testing only".
add_env TURNSTILE_SITE_KEY 1x00000000000000000000AA
add_env TURNSTILE_SECRET_KEY 1x0000000000000000000000000000000AA

echo "==> Creating the local database"
pnpm payload migrate

echo "==> Loading dealership info and the Bad Boy catalog"
pnpm seed

cat <<'MSG'

Setup complete. The website starts automatically on port 3000.
Admin sign-in (local demo only): admin@roanokemowers.com / demo-admin-password
MSG
