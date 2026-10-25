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
pnpm wrangler secret put PAYLOAD_SECRET        # paste the output of: openssl rand -hex 32
pnpm wrangler secret put FIELD_ENCRYPTION_KEY  # paste the output of: openssl rand -base64 32
pnpm wrangler secret put TURNSTILE_SECRET_KEY  # from step 5 below
pnpm wrangler secret put TURNSTILE_SITE_KEY    # from step 5 below
```

> **Keep a copy of `FIELD_ENCRYPTION_KEY` somewhere safe** (for example a password manager). If it's
> lost, stored credit applications can't be decrypted. Never reuse the demo/test keys.

4. **Email alerts:** in the Cloudflare dashboard, open **Email Service** and onboard
   `roanokemowers.com` as a sending domain (Cloudflare adds the DNS records). Add the lead address
   (currently anattalife@icloud.com) as a verified destination if Cloudflare asks. The site sends
   from `leads@roanokemowers.com` by default (change with the `EMAIL_FROM_ADDRESS` variable).
5. **Spam protection:** in the dashboard, open **Turnstile**, add a widget for `roanokemowers.com`,
   and copy its site key and secret key into the two secrets above. The forms refuse to submit in
   production until these are set.
6. **UPS live rates:** at developer.ups.com, sign in with the shop's UPS account, create an app,
   add the **Rating** product and link your UPS account number. Then add three secrets:
   `UPS_CLIENT_ID`, `UPS_CLIENT_SECRET`, `UPS_ACCOUNT_NUMBER`, and the variable `UPS_ENV=production`.
   Check the ship-from address in Admin → Store settings.

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

Everything runs on Cloudflare, plus UPS for shipping rates (the owner's choice). No other outside
services are planned without the owner's approval.

| Item | Used for |
| --- | --- |
| Payment processor for parts checkout | **Not decided.** Checkout stays closed on the live site until the shop's processor is connected |
| Daily cleanup of old credit applications (Cloudflare cron) | Stage 6 |

## Images

Payload's built-in image resizing needs `sharp`, which can't run on Workers. Uploaded photos are
stored at full size in R2. Before launch we'll turn on Cloudflare Images (Image Transformations) so
photos are resized and converted to WebP/AVIF when served.
