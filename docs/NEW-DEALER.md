# Setting up the site for a new dealer

Each dealer gets their own copy of the site on Cloudflare: their own Worker, database and photo
storage. The code is the same for every dealer. The dealer enters their own details, logo, colors
and pricing in a **setup wizard** the first time the site opens.

## 1. Deploy a copy

Follow [DEPLOY.md](DEPLOY.md) with the dealer's names and domain. In `wrangler.jsonc` set:

- `name`: the Worker name, e.g. `smithmowers`
- `d1_databases[0].database_name` and `database_id` (from `pnpm wrangler d1 create <name>`)
- `r2_buckets[0].bucket_name` (from `pnpm wrangler r2 bucket create <name>-media`)
- `vars.EMAIL_FROM_ADDRESS`: an address on the dealer's domain, e.g. `leads@smithmowers.com`
- `vars.EMAIL_FROM_NAME`: the dealer's name
- `vars.NEXT_PUBLIC_SITE_URL`: the live web address

Keep each dealer's `wrangler.jsonc` on its own branch or fork so deployments don't overwrite each other.

Every dealer needs **their own** secrets. Never copy them from another dealer or from the demo:

```bash
pnpm wrangler secret put PAYLOAD_SECRET        # openssl rand -hex 32
pnpm wrangler secret put FIELD_ENCRYPTION_KEY  # openssl rand -base64 32  (keep a safe copy)
pnpm wrangler secret put SETUP_CODE            # openssl rand -hex 12  (give this to the dealer)
```

## 2. Load the Bad Boy catalog

```bash
CLOUDFLARE_ENV= NODE_ENV=production ALLOW_PRODUCTION_SEED=true pnpm seed
```

This loads the full Bad Boy line, specs, product photos and accessories. It doesn't add any dealer
details or accounts; the wizard does that.

## 3. The dealer runs the setup wizard

Until setup is finished, every page of the site sends visitors to `/setup`. The dealer enters the
**setup code** and then, in five steps:

1. **Dealership**: name, legal name, phone, lead email, address, website, hours
2. **What you sell**: untick categories they don't carry (e.g. UTVs) or single models (e.g. the
   Bandit 550). Hidden equipment disappears from the website everywhere
3. **Logo and look**: logo upload, main and button colors (with a live preview of their logo beside
   the Bad Boy logo), the area they serve and a home page intro
4. **Prices and financing**: show their price, price with MSRP crossed out, MSRP only, or hide
   prices ("Get today's price" button); optional monthly payment estimate (APR, term, down payment);
   sales tax on parts
5. **Admin account**: their name, email and password

When they finish, the site is live and `/setup` is locked. Everything can be changed later in the
admin under **Settings → Dealership info** (and **We don't sell this** on any category or model),
along with a home page photo, a separate finance email
and per-model or per-unit price display.

Why the setup code: a brand-new site has no accounts. Without the code, whoever opened it first
could create the admin account. Payload's own "create first user" screen is turned off for the same
reason.

## Demos and dealer profiles

For a demo that skips the wizard, `pnpm seed` can load a dealer profile from `dealers/<name>.json`
(start from `dealers/_template.json`): `DEALER_PROFILE=<name> pnpm seed`. Demos default to
`roanoke-golf-cars`. To try the wizard locally:

```bash
rm -rf .wrangler && pnpm payload migrate && DEALER_PROFILE=none pnpm seed && pnpm dev
```
