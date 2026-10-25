# Demo the site in GitHub Codespaces

Codespaces runs the whole site in your browser. Nothing to install.

## Start it

1. Open <https://github.com/anattalife/badboy>.
2. Click the green **Code** button, open the **Codespaces** tab, then **Create codespace on main**.
3. Wait for setup to finish (about 3–5 minutes the first time). It installs everything, creates a
   demo database and loads the full Bad Boy catalog.
4. The website opens in a new browser tab. If it doesn't, open the **Ports** tab at the bottom and
   click the globe icon next to port **3000**.

The first page load after starting can take 20–30 seconds while the site compiles. After that it's quick.

## Things to try

**Public site**
- Home page: pick an acreage size under “How much ground are you covering?”
- **Equipment**: all 62 Bad Boy models across 10 categories
- Open any model (try **Rogue** or the **1025 Sub-Compact Tractor**) to see specs and every
  configuration with its Bad Boy model number
- **Implements → Rotary Cutters**: specs for each size side by side
- **In stock**: eight sample units (stock numbers starting with `DEMO-`). Try the filters, then open a unit
- **Compare**: tick “Compare” on two to four models, then **Compare now** at the bottom of the screen.
  Copy the page address to share the comparison
- **Get a quote** on any model or unit: the form already knows what you were looking at
- **Value your trade** (footer, or the link on any unit page)
- **Financing**: fill in the credit application with made-up details. Use a fake SSN that passes the
  format check, such as `123-45-6789`. **Never enter real personal information in the demo.**
- Every form shows a small “Testing only” Cloudflare box; that's the spam check in test mode
- Alert emails aren't sent from the demo. To see what would have been emailed, look in the terminal
  running the site for lines starting with `[email:log-only]`
- **Parts**: search by name or part number (try `088-4020-00`), or pick your machine under “Fits my
  machine”. Model pages also show matching parts
- **Cart and checkout**: add parts, check out with any US address, choose a UPS service and place
  the order. The demo uses **sample shipping rates** (UPS isn't connected yet) and a **test payment**
  (no card is asked for or charged). Try a Virginia address to see sales tax added
- Resize the window narrow to see the phone layout

**Admin panel** — add `/admin` to the end of the site address.

| | |
| --- | --- |
| Email | `admin@roanokemowers.com` |
| Password | `demo-admin-password` |

This login exists only inside your Codespace's demo database. It is never used on the live site.

- **Leads**: every quote, trade-in and contact form lands here. Set the status, assign it, add notes
- **Credit applications**: open one and look at the **Applicant** tab. You'll see the SSN because the
  demo login is an Admin. Create a staff account with only the **Sales** role and the menu item
  disappears
- **Access log**: every time someone opened an application's sensitive details
- **Dealership info**: set how many days to keep credit applications before they're deleted
- **Parts store → Orders**: orders from the demo checkout. Add a UPS tracking number and the
  customer's order page shows a tracking link
- **Parts store → Price list imports**: upload a CSV to add or update parts in bulk. Download the
  template from `/parts-import-template.csv` on the demo site
- **Parts store → Parts**: add a price and shipping weight to make a part orderable online
- **Parts store → Store settings**: UPS services, handling fee, free shipping threshold, sales tax
- **Inventory**: add a unit (pick the Bad Boy model, enter a stock number and price, upload photos),
  then find it under **In stock**. Mark it **Sold** and it disappears from the website
- **Equipment models**: edit a model, add a “starting at” price, or upload a photo, then click
  **Publish** and refresh the public page
- **Dealership info**: change hours or add an announcement banner (it appears on every page)
- **Staff**: create accounts with roles (Sales, Finance, Service, Parts, Manager, Admin)

## Stop or delete it

Codespaces stop on their own after 30 minutes idle. To save your free hours, stop it from
<https://github.com/codespaces> (**…** → **Stop codespace**). Deleting a codespace deletes its demo
data; the next one starts fresh.

## Reset the demo data

In the Codespace terminal:

```bash
rm -rf .wrangler && pnpm payload migrate && pnpm seed
```
