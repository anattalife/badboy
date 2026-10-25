# Deploying to Cloudflare

Not needed until launch. This is a draft checklist; we'll walk through and verify each step together
in stage 6 (launch prep) before anything goes live.

## What you need

- A Cloudflare account on the **Workers Paid** plan. The site's Worker is about 3.5 MB compressed,
  over the free plan's 3 MB limit.
- The `roanokemowers.com` domain added to Cloudflare (DNS managed there).

## One-time setup

Run these from a Codespace (or any machine with the repo) after `pnpm wrangler login`:

```bash
# 1. Database
pnpm wrangler d1 create roanokemowers
#    Copy the database_id it prints into wrangler.jsonc (replace "DATABASE_ID").

# 2. File storage for photos and brochures
pnpm wrangler r2 bucket create roanokemowers-media

# 3. Secrets (you'll be prompted for each value)
pnpm wrangler secret put PAYLOAD_SECRET   # paste the output of: openssl rand -hex 32
```

Then in the Cloudflare dashboard:

1. **Workers & Pages → roanokemowers → Settings → Builds**: connect the `anattalife/badboy`
   GitHub repo, branch `main`.
   - Build command: `pnpm run deploy:database && pnpm exec opennextjs-cloudflare build`
   - Deploy command: `pnpm exec opennextjs-cloudflare deploy`
   - Build variables: `CLOUDFLARE_ENV` = *(leave empty)*. Add `PAYLOAD_SECRET` as a build secret too
     (migrations need it).
2. **Settings → Domains & Routes**: add `roanokemowers.com` and `www.roanokemowers.com`.
3. Visit `https://roanokemowers.com/admin` and create the first account. The first account becomes
   the admin automatically. Do not reuse the demo password.

After that, every push to `main` that passes CI deploys automatically.

## Loading the catalog into production

The live database starts empty. To load dealership info and the Bad Boy catalog once:

```bash
CLOUDFLARE_ENV= NODE_ENV=production ALLOW_PRODUCTION_SEED=true pnpm seed
```

The seed refuses to run against production without `ALLOW_PRODUCTION_SEED=true`. It never creates
the demo admin there if an account already exists.

## Later stages will add

| Secret | Used for |
| --- | --- |
| `RESEND_API_KEY` (or Postmark) | Lead and request emails |
| `TURNSTILE_SECRET_KEY` | Spam protection on forms |
| `FIELD_ENCRYPTION_KEY` | Encrypting SSN and income on loan applications |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Parts checkout |

## Images

Payload's built-in image resizing needs `sharp`, which can't run on Workers. Uploaded photos are
stored at full size in R2. Before launch we'll turn on Cloudflare Images (Image Transformations) so
photos are resized and converted to WebP/AVIF when served.
