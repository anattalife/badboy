# Project notes

Running notes for whoever works on this next (including future AI sessions). Keep it current.

## Client

- **Business:** Roanoke Golf Cars, LLC, 4802 Melrose Ave NW, Roanoke, VA 24017 · 540.986.0098 ·
  fax 540.904.6500 · Mon–Fri 9–5, Sat 9–2, Sun closed. Existing site: roanokegolfcars1.com (Dealer Spike).
- **This site:** a Bad Boy dealer website that any dealer can use (the owner now works for Bad Boy).
  Roanoke Golf Cars / RoanokeMowers.com is the first dealer profile (`dealers/roanoke-golf-cars.json`).
- **Leads go to:** anattalife@icloud.com (temporary, set in Admin → Dealership info).
- **Photos:** Bad Boy's official product photos and logos, supplied by the owner on 2026-11-06 (see Photos).
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
| 4 | Parts store: catalog, CSV price-list import, cart, checkout, UPS live rates, sales tax, orders (shipping only) | **Done, awaiting review; payment processor not yet chosen** |
| 4b | Dealer-neutral: dealer profiles, settings-driven name, logo, colors, home page and metadata | Done |
| 4c | Dealer website in a box: setup wizard, dealer + Bad Boy logo lockup, Bad Boy black/orange look, dealer price display choice, payment estimate, offers, build & quote, phone action bar | Done, awaiting review |
| 4d | Editable pages (block builder, live preview, drafts, menus) and other-brand/used inventory | Done, awaiting review |
| 5 | Service info pages and service request form | Service page is editable with a request form; dedicated service form not started |
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
- **Design:** Bad Boy black (`#1D1D1B`) and orange (`#E8641B`) by default, neutral greys; each
  dealer's main and button colors override them. Archivo variable font, using its wide cut (`.type-decal`)
  for headlines. Signature element: the acreage chooser in the home hero. Models without photos fall
  back to generic machine silhouettes (`src/components/EquipmentArt.tsx`).

## Multi-dealer setup

- **Nothing dealer-specific is hardcoded in `src/`.** The name, legal name, address, phone, logo,
  colors (`brandColor`, `accentColor`), home headline area (`regionName`), intro (`heroText`) and the
  mountain horizon (`showMountains`) all come from Admin → Dealership info.
- **Dealer profiles** live in `dealers/<name>.json` (start from `dealers/_template.json`). `pnpm seed`
  loads the one named by `DEALER_PROFILE` (default `roanoke-golf-cars`) into Dealership info and the
  store's tax settings; `adminEmail` is the demo admin login.
- **Colors** are applied as CSS variables on `<body>` (`themeStyle` in `src/lib/format.ts`); deep
  variants are derived with `color-mix`. Invalid hex values fall back to the stylesheet.
- **Ship-from** falls back to the dealership address when Store settings → ship-from is blank.
- **Consent text** names the dealer's legal name (`consentText(legalName)`).
- **Per-dealer Worker vars** (`wrangler.jsonc`): `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`,
  `SITE_URL`, plus the Worker, D1 and R2 names. One deployment per dealer.
- Migration `dealer_branding` was written by hand (see the comment in it); the generated one was wrong.

## Dealer website in a box (stage 4c)

- **Setup wizard** (`/setup`, `src/app/(setup)/`, `src/components/setup/SetupWizard.tsx`). Until
  `site-settings.setupCompletedAt` is set, the public layout redirects every page to `/setup`.
  Steps: dealership, what you sell, logo/colors (live lockup preview), prices/financing/tax, admin account.
  `completeSetup` (server action) re-validates everything, creates the admin, uploads the logo and
  saves the settings; it rolls back the account if a later step fails.
- **Security:** production requires the `SETUP_CODE` secret (12+ characters, constant-time compare,
  `src/lib/setupCode.ts`); without it `/setup` only explains how to set it. The Users hook refuses
  the first account from anything but the local API, and `/admin/create-first-user` redirects to
  `/setup`, so nobody can claim a fresh site through Payload's own screen or REST. Once set up,
  `/setup` shows "already set up".
- **Seed:** production seeds load no dealer profile and never create a login. Demos load
  `DEALER_PROFILE` (default Roanoke) and mark setup complete. `DEALER_PROFILE=none` gives a fresh
  wizard install. The migration marks existing sites (with a site name) as set up.
- **Logo lockup** (`DealerLockup` in `Header.tsx`): dealer logo or name, divider, Bad Boy logo,
  "Authorized dealer". Header and footer (white plate behind the logo on dark backgrounds).
- **Prices** (`src/lib/pricing.ts`, `src/components/Price.tsx`): `priceDisplay` = dealer / both /
  msrp / hidden, set in Dealership info with a per-model and per-unit override. Never invents a
  price; with nothing to show it's a "Get today's price" link to the quote form. Model MSRP is
  `models.msrp` or the lowest configuration MSRP.
- **Payment estimate:** optional, amortized from the dealer's APR, term and down payment; disclaimer
  printed once per page above the footer.
- **Offers** collection (drafts, start/end dates, models they apply to). Shown on `/offers`, the
  home page and matching model pages. "Claim this offer" → quote lead with `offer` set.
- **Build & quote:** model pages with several configurations have a picker; the lead stores the
  configuration label (name + Bad Boy model number), validated against the model.
- **Lead routing:** credit application alerts go to `financeEmail` when set; `serviceEmail` is for
  stage 5.
- **Phones:** fixed Call / Get a quote / Apply bar; cart moves into the menu.
- **Financing application choice:** `financeApplication` = builtin / links / both, with up to 4
  `financeLinks` (https only) to a lender's online application (`src/lib/financing.ts`). The
  Financing page shows lender buttons and/or the built-in form. With "links only" the built-in
  form is hidden and `submitCreditApplication` refuses submissions, so no SSNs are collected; with no
  valid link it falls back to the built-in form. Set in wizard step 4 or Dealership info.
- **Dealership info** is organized in tabs (Dealership, Look and home page, Prices and financing,
  Leads and privacy). Tabs and collapsibles don't change the database.
- **Equipment a dealer doesn't sell:** `notCarried` ("We don't sell this") on categories and models
  (`src/access/carried.ts`). Public access and every public getter in `src/lib/payload.ts` exclude
  them, also for signed-in staff browsing the site; the admin still lists them. A hidden category
  hides its models. Models are filtered by hidden category **IDs**: querying `category.notCarried`
  through the relationship made Payload build a runaway join. Wizard step 2 sets these.
- Migration `dealer_box` was hand-edited (adds site_settings columns in place; a rebuild would
  cascade-delete the hours rows).

## Editable pages (stage 4d)

The owner wants every page editable "like WordPress". Built with Payload's own blocks, drafts and
live preview; no extra services.

- **Pages** collection (`src/collections/Pages.ts`): title, address, intro, `layout` (blocks),
  search-engine title/description. Drafts with autosave (800 ms) and up to 25 versions.
- **Blocks** (`src/blocks/config.ts`, rendered by `src/blocks/RenderBlocks.tsx`): Hero banner, Text
  (rich text), Photo with text, Equipment categories, Featured models, Current offers, In-stock
  units, Mower finder (acreage), Call to action, Feature list, Questions and answers, Visit us,
  Contact form. The admin calls them "Sections". Hero headings support `{region}`.
- **Built-in pages** (`BUILT_IN_PAGES`): home, equipment, inventory, offers, compare, contact,
  trade-in, financing, parts, service. Fixed address, can't be deleted. Home and Service are all
  blocks; on the others the title/intro come from the page and its blocks appear **below** the
  working part (listing, form, store). `src/components/CmsPage.tsx` has `pageText`, `pageMetadata`
  (SEO falls back to intro plus dealer name and city), `PageBlocks`, `BlockPage`.
- **New pages** render at `/<address>` (`src/app/(frontend)/[slug]`). Reserved addresses (admin,
  api, setup, preview, cart, checkout, order…) are refused. New drafts get a null address until
  titled, so two untitled drafts don't clash on the unique index.
- **Starting content** is in `src/blocks/defaults.ts`; `seedPages` (every install, demo and live)
  creates missing pages and the menus and never overwrites edits. Model slugs in defaults are
  resolved to IDs at seed time.
- **Menus** global (`src/globals/Navigation.ts`): main menu, footer links, footer text. Defaults in
  the same file are used if empty.
- **Preview:** `/preview?path=` (signed-in staff only) turns on Next draft mode; pages then read the
  latest draft. `PreviewBar` uses `RefreshRouteOnSave` (`@payloadcms/live-preview-react`) so the
  admin's Live Preview refreshes after each autosave. `/preview/exit` turns it off.

## Inventory: used and other brands (stage 4d)

- `brand` = badboy / other on each unit. Bad Boy units pick a model (category, make, specs and
  factory photos follow it). Other brands type make + model name and pick a category; the hook
  refuses an other-brand unit without a make.
- Categories can be **inventory-only** (`inventoryOnly`): golf carts, trailers, other equipment.
  They appear as In stock filters but never in the Bad Boy catalog, menus or `/equipment/*`
  (`getCategories(true)` includes them). Seed creates "Other equipment" for everyone plus the
  dealer profile's `inventoryCategories` (Roanoke: Golf carts, Trailers).
- `details` array (label/value) shows as a Details table on the unit page.
- In stock has a Brand filter. The migration marks existing units without a model as other brand.

## Photos

- Source: the owner's `Bad_Boy_Pictures.zip` (Bad Boy studio photos). `scripts/prepare_photos.py`
  matches files **by file name** (some folders hold another model's photos: Revolt SD frames were in
  the Revolt folder, MZ Rambler inside MZ Magnum, ZT Elite inside Raider), trims empty margins,
  resizes to 1600 px WebP and writes `src/seed/media/` plus `src/seed/data/photos.json`.
  Re-run it with a new photo folder, then `pnpm seed`.
- 171 photos for 30 models and 1 part (the 4A charger). 360° sets are 8 frames; the front
  three-quarter frame is the main photo. Every file name starts with `bb-`.
- `pnpm seed` (`src/seed/photos.ts`) uploads them once to Media (R2) and attaches them. A model or
  part whose photos staff have changed is left alone. Production gets them through the same
  production seed command as the catalog.
- Model pages show a gallery (`ProductGallery`); cards show the whole machine (`object-contain`).
  Inventory units without their own photos show the model's photos, labeled "Factory photos".
- Bad Boy logos are in `public/brand/` (authorized-dealer mark in the header top bar and footer).
- **No photos yet** for: Revolt Fury blower, push mower, all implements, Bandit UTVs, Recon,
  Terrain, E-Series hedge trimmer/snow thrower/pressure washer/trimmer attachments, all gas tools.
  Two charger photos (2A single-port, dual-port) have no matching part in the catalog.

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
- **Tax:** charged only when shipping to `taxState`. Off by default; the dealer profile sets it (Roanoke:
  VA, 5.3%, shipping not taxed). Editable in Store settings; **owner to confirm with accountant**.
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
- **MSRP** (`models.msrp`, `configurations.msrp`) shows only when the dealer picks an MSRP price
  display (see stage 4c).
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
