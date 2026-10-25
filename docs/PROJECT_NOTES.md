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
- **No third-party services without explicit owner approval.** Default to what Cloudflare already
  provides (email sending, Turnstile, D1, R2). The owner does not want SaaS vendors suggested by default.
  The parts-store payment processor is undecided; ask which processor the shop already uses.
  UPS (live shipping rates) was requested by the owner.

## Stages

| # | Stage | Status |
| --- | --- | --- |
| 1 | Foundation, admin, roles, full model catalog | Done, approved |
| 2 | Inventory (stock units, photos, prices), search/filters, side-by-side compare; catalog expanded with configurations, model numbers, MSRP and implement sizes | Done |
| 3 | Lead forms (quote, trade-in, contact), full in-house loan application (encrypted SSN/income) | Done |
| 4 | Parts store: catalog, CSV price-list import, cart, checkout, UPS live rates, VA sales tax, orders (shipping only) | **Done, awaiting review; payment processor not yet chosen** |
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

## Inventory (stage 2)

- `inventory` collection: stock number (unique), condition, status, model link (or make/model for
  other brands), year, hours, configuration/deck/engine, price, MSRP, photos, notes. Title, slug,
  category and `deckInches` are derived in a `beforeValidate` hook.
- Public sees only `available`, `on-order` and `pending`. `sold` and `hidden` are staff-only.
  Serial numbers and sold dates are staff-only fields. Sales and manager roles can edit inventory;
  only managers and admins can delete.
- `/inventory` filters by category, condition, price range, deck range and sort (GET form, works
  without JavaScript). Unit pages live at `/inventory/<slug>`.
- Sample units (stock numbers `DEMO-…`) are seeded only outside production. New sample units use
  Bad Boy's published MSRP for that configuration as their price.

## Compare (stage 2)

- `/compare?models=a,b,c` (max 4) is the shareable source of truth. The “Compare” checkboxes and the
  floating tray store a per-visitor selection in localStorage.
- `buildComparison` (`src/lib/compare.ts`) lines specs up by group and label and flags rows that
  differ.

## Leads and financing (stage 3)

- **Forms** (`src/app/(frontend)/actions.ts`): quote (`/contact?model=` or `?unit=`), contact
  (`/contact`), trade-in (`/trade-in`) and credit application (`/financing`). Server actions validate
  everything server-side, run spam checks, save with `overrideAccess`, then email an alert. The
  `leads` and `credit-applications` collections have `create: () => false`, so nothing can be created
  through the public API, only through these handlers.
- **Spam** (`src/lib/spam.ts`): Cloudflare Turnstile (required in production; the forms refuse to
  submit if it isn't configured), a honeypot field and a minimum fill time. Local/Codespaces use
  Cloudflare's public test keys.
- **Email** (`src/lib/email.ts`): a Payload email adapter on Cloudflare Email Sending (`send_email`
  binding `EMAIL`). Outside the deployed Worker, emails are written to the log. A failed alert never
  loses a lead; it's saved first. Staff password resets use the same adapter. No customer
  confirmation emails yet (Email Sending may only deliver to verified addresses; confirm at launch).
- **Credit applications** (`src/collections/CreditApplications.ts`):
  - SSN, date of birth, monthly income and other income are AES-256-GCM encrypted
    (`src/lib/crypto.ts`, key `FIELD_ENCRYPTION_KEY`). The form refuses to save if the key is missing.
  - Only finance and admin can read them. Single-document reads decrypt and write an `audit-log`
    entry; lists always show masked values. Saving a masked value back keeps the stored ciphertext.
  - Alert emails contain no sensitive data, only a link to the admin.
  - Retention: applications older than `site-settings.creditApplicationRetentionDays` (default 365,
    **owner to decide**) are deleted after each new submission. A daily Cloudflare cron for this is
    planned in stage 6.
  - The co-applicant is stored as an array (max 1 row) in its own table. Keeping both people as flat
    columns exceeded **D1's 100-parameter-per-query limit** on updates. A test fails if any table gets
    wider than 50 columns.
  - Consent wording is in `src/app/(frontend)/financing/consent.ts` and is a **draft for lender and
    attorney review**. The exact text, time, IP and browser are stored with each application.
- React 19 clears forms after an `action` submit, so forms submit via `onSubmit` plus
  `startTransition` to keep what people typed when validation fails.

## Parts store (stage 4)

- **Owner's choices:** online card payment (processor TBD), **shipping only** (no pickup), parts from
  both the Bad Boy accessory catalog and the dealer's own price list, **UPS live rates**.
- **Parts** (`src/collections/Parts.ts`): part number (unique, import key), price, MSRP, availability,
  stock, weight/dimensions, models it fits, fitment notes. `canBuyOnline` = active + price + weight +
  not discontinued. Parts over 150 lb can't ship UPS and show "call for freight".
- **Price list import** (`src/collections/PartImports.ts`, `src/lib/partsImport.ts`): upload a CSV in
  the admin. Matches on part number; updates only the columns present; accepts common header names
  (`src/lib/csv.ts` `PART_COLUMNS`); links models mentioned in a fitment column; up to 3,000 rows per
  file; results and problems saved on the import record. Template: `/parts-import-template.csv`.
  Upload files are stored in R2.
- **Bad Boy accessories** are seeded as 106 parts (one per part number) with MSRP as the price.
  Bad Boy doesn't publish weights, so **in production they show "Call to order" until staff add a
  shipping weight**. The demo seed adds sample weights (price ÷ 25 lb) so checkout can be tried.
- **Cart** lives in localStorage as `{id, qty}` only. `priceCart` re-prices from the database.
- **Shipping** (`src/lib/ups.ts`): OAuth client credentials + Rating API v2409 `Shop`, built from
  UPS's published OpenAPI specs (github.com/UPS-API/api-documentation). Negotiated rates are preferred.
  Packing (`src/lib/store.ts`): parts with dimensions ship alone; small parts combine into the default
  box up to 50 lb. Handling fee, free Ground threshold, offered services and ship-from address are in
  **Store settings**. Without UPS credentials: sample rates outside production (clearly labeled);
  in production checkout shows an error instead.
- **Signed quotes:** each rate shown is HMAC-signed with the cart and address fingerprints and a
  30-minute expiry, so the price can't be edited in the browser and stale quotes are rejected.
- **Tax:** charged only when shipping to `taxState` (default VA, 5.3%; shipping not taxed by default).
  Editable in Store settings; **owner to confirm with accountant**.
- **Orders** (`src/collections/Orders.ts`): created only by `placeOrder`; parts and manager roles
  manage them. Customers see their order at `/order/<number>?t=<token>`; the token is unreadable even
  to staff. Paid orders decrement `stockQty` when set and email an alert (no customer email yet).
- **Payment** (`src/lib/payments.ts`): only a demo `test` provider (marks paid, no card). In
  production `getPaymentProvider()` returns null, so **checkout stays closed until the shop's
  processor is implemented**. `markOrderPaid` lives in `src/lib/orders.ts` (server-only) so it can't
  be called from the browser. Never export privileged helpers from a `'use server'` file.

## Catalog data

`src/seed/data/catalog.json` has 62 models in 10 categories, taken from badboycountry.com spec
tables on 2026-10-25. As of 2026-10-25 Bad Boy had not published a 2027 lineup.

- **Mower configurations** (69 total across 14 mowers) come from the `/mowers/build/<model>` pages,
  each with Bad Boy's model number (e.g. `BRG61385KA`) and MSRP. The engine/deck upcharge amounts on
  those pages look like placeholders ($111, $222, $555…) and were ignored; the per-configuration MSRP
  is a separate value on each option. Rebel X, MZ Rambler and E-Magnum have no build page, so their
  configurations come from the product pages without model numbers or MSRP.
- **MSRP is stored but not shown publicly** (`models.msrp`, `configurations.msrp`). Showing it is the
  owner's call.
- **Implements**: 14 types with 50 sizes; per-size specs render as a size table. Model numbers exist
  only for rotary tillers and spreaders. No implement MSRP is published.
- **Accessories**: 82 (68 mower, 7 Bandit, 7 E-Series) are saved in `src/seed/data/accessories.json`
  for the parts store (stage 4). 31 have MSRP and part numbers (from the Rogue and Revolt build pages).
- Summaries and highlights are paraphrased. Dealer prices are set in the admin. Each model keeps its
  `sourceUrl` (staff-only field).

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
- 7' snow pusher: working width 85" is listed wider than its 83" overall width.
- Rotary cutter headings and spec tables disagree on which sizes are standard- vs heavy-duty.
- E-Series battery text says 8AH is available; the size list stops at 5.0AH.
