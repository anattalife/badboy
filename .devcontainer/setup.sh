#!/usr/bin/env bash
# One-time setup for a new Codespace (or any fresh checkout).
# Installs dependencies, creates a local database and loads the Bad Boy catalog.
set -euo pipefail

echo "==> Installing pnpm"
npm install -g pnpm@10.28.0 >/dev/null

echo "==> Installing dependencies"
pnpm install --frozen-lockfile

if [ ! -f .env ]; then
  echo "==> Creating .env with a random local secret"
  echo "PAYLOAD_SECRET=$(openssl rand -hex 32)" > .env
fi

echo "==> Creating the local database"
pnpm payload migrate

echo "==> Loading dealership info and the Bad Boy catalog"
pnpm seed

cat <<'MSG'

Setup complete. The website starts automatically on port 3000.
Admin sign-in (local demo only): admin@roanokemowers.com / demo-admin-password
MSG
