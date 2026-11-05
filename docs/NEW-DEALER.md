# Setting up the site for a new dealer

Each dealer gets its own copy of the site on Cloudflare: its own Worker, database and file bucket.
The code is the same for every dealer; only the settings below change.

## 1. Make a dealer profile

```bash
cp dealers/_template.json dealers/<dealer-name>.json
```

Use lowercase letters, numbers and dashes for `<dealer-name>` (for example `smith-farm-supply`).
Fill in every field:

| Field | What it's for |
| --- | --- |
| `siteName` | Shown in the header, page titles and emails |
| `legalName` | Footer and the credit application consent wording |
| `siteUrl` | The live web address, e.g. `https://www.smithmowers.com` |
| `phone`, `fax`, `address`, `hours` | Contact details shown across the site |
| `leadEmail` | Where quote, trade-in, contact and credit application alerts go |
| `adminEmail` | The demo admin login (demo only, never created on the live site if an account exists) |
| `regionName` | Finishes the home headline “Bad Boy equipment for …”, e.g. `the Shenandoah Valley` |
| `heroText` | One or two sentences under the home headline |
| `serviceArea`, `facebookUrl` | Optional |
| `brandColor`, `accentColor` | Main color and button color, as `#rrggbb` |
| `showMountains` | `true` to show the mountain horizon on the home page |
| `tax` | Sales tax for parts orders: state, rate and whether shipping is taxed. Confirm with the dealer's accountant |

Everything here can be changed later in **Admin → Dealership info** and **Parts store → Store
settings**. A logo can be uploaded there too (a wide logo on a transparent background).

## 2. Try it in a Codespace

```bash
rm -rf .wrangler && pnpm payload migrate && DEALER_PROFILE=<dealer-name> pnpm seed
pnpm dev
```

## 3. Cloudflare names and variables

In `wrangler.jsonc` set, for this dealer:

- `name`: the Worker name, e.g. `smithmowers`
- `d1_databases[0].database_name` and `database_id` (from `pnpm wrangler d1 create <name>`)
- `r2_buckets[0].bucket_name` (from `pnpm wrangler r2 bucket create <name>-media`)
- `vars.EMAIL_FROM_ADDRESS`: an address on the dealer's domain, e.g. `leads@smithmowers.com`
- `vars.EMAIL_FROM_NAME`: usually the `siteName`
- `vars.NEXT_PUBLIC_SITE_URL`: the same as `siteUrl`

Keep each dealer's `wrangler.jsonc` on its own branch or fork so deployments don't overwrite each other.

## 4. Secrets, email, spam check, UPS

Follow [DEPLOY.md](DEPLOY.md) with the dealer's domain. Every dealer needs **its own**
`PAYLOAD_SECRET` and `FIELD_ENCRYPTION_KEY`. Never copy these from another dealer or from the demo.

## 5. Load the catalog

```bash
CLOUDFLARE_ENV= NODE_ENV=production ALLOW_PRODUCTION_SEED=true DEALER_PROFILE=<dealer-name> pnpm seed
```

Then sign in at `/admin`, create the first account (it becomes the admin), and set prices,
inventory and parts weights.
