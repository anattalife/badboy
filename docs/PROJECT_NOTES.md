# Project notes

Running notes for whoever works on this next (including future AI sessions). Keep it current.

## Client

- **Business:** Roanoke Golf Cars, LLC, 4802 Melrose Ave NW, Roanoke, VA 24017 · 540.986.0098 ·
  fax 540.904.6500 · Mon–Fri 9–5, Sat 9–2, Sun closed. Existing site: roanokegolfcars1.com (Dealer Spike).
- **This site:** RoanokeMowers.com, the full Bad Boy line only.
- **Leads go to:** anattalife@icloud.com (temporary, set in Admin → Dealership info).
- **Photos:** placeholders until real/dealer media is available.
- **Working agreement:** the owner wants to be consulted before major decisions. Build in stages and
  stop for review after each.

## Stages

| # | Stage | Status |
| --- | --- | --- |
| 1 | Foundation, admin, roles, full model catalog | **Done, awaiting review** |
| 2 | Inventory (stock units, photos, prices), search/filters, side-by-side compare | Not started |
| 3 | Lead forms (quote, trade-in, contact), full in-house loan application (encrypted SSN/income) | Not started |
| 4 | Parts store: cart, Stripe checkout (test mode), shipping and pickup | Not started |
| 5 | Service info pages and service request form | Not started |
| 6 | Launch prep: SEO, caching, Cloudflare Images, security docs for loan data | Not started |

## Decisions

- **Next.js + Payload on Cloudflare Workers (OpenNext, D1, R2).** Chosen by the owner after comparing
  options. OpenNext over vinext because vinext was experimental at the time.
- **Payload 3.92.0 with Next 16.3.3**, matching Payload's `with-cloudflare-d1` template at the
  `v3.92.0` tag. The template on Payload's `main` branch was ahead of the published packages.
- **Migrations only (`push: false`)**, locally and in production. Change a collection, then
  `pnpm payload migrate:create <name>`. CI fails if a schema change has no migration.
- **Builds use local bindings.** Only production `payload` CLI commands (deploy-time migrations)
  connect to the real D1. See `remoteBindings` in `src/payload.config.ts`.
- **GraphQL disabled.** Not used; smaller bundle and attack surface.
- **Public reads use `overrideAccess: false`** (`src/lib/payload.ts`) so drafts and private fields
  never leak through server-rendered pages.
- **Pages are `force-dynamic` for now.** Add caching (OpenNext R2 incremental cache plus tag
  revalidation from Payload hooks) in stage 6.
- **Roles:** admin, manager, sales, finance, service, parts (`src/access/roles.ts`). Only admin
  manages staff and site settings. The first account created becomes admin. Finance plus admin will be
  the only roles that can read SSN/income (stage 3).
- **Design:** Blue Ridge palette (ridge slate `#2F4A5C`, fescue `#E9ECE3`, ink `#1B2630`), Bad Boy
  orange `#E8641B` for primary actions only. Archivo variable font, using its wide cut (`.type-decal`)
  for headlines. Signature element: the acreage chooser in the home hero. Placeholder art is generic
  machine silhouettes (`src/components/EquipmentArt.tsx`), not Bad Boy imagery.

## Catalog data

`src/seed/data/catalog.json` has 62 models in 10 categories, taken from badboycountry.com spec
tables on 2026-10-25. Summaries and highlights are paraphrased. No prices (the dealer sets them in
the admin). Each model keeps its `sourceUrl` (staff-only field).

Inconsistencies on Bad Boy's own pages to confirm with the dealer/Bad Boy:
- Maverick and ZT Elite pages disagree with themselves on engine options; spec tables were used.
- Renegade Gas front and rear tire labels appear swapped on Bad Boy's page; recorded as 26x12-12
  rear, 15x6-6 front.
- 4025 listed height (104.06") is taller than the 4035H.
- Bandit 550: winch listed as included in one place and 750-only in another.
- Recon operating capacity: 748 lb (824 lb with optional counterweight) per the spec table.
- Terrain beacon heights look reversed.
- E-Series trimmer/chainsaw/pole saw battery Wh labels are inconsistent.
- Mower warranties are not stated on model pages and were left out.
