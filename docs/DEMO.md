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
- Open any model (try **Rogue** or the **1025 Sub-Compact Tractor**) to see specs and configurations
- Resize the window narrow to see the phone layout

**Admin panel** — add `/admin` to the end of the site address.

| | |
| --- | --- |
| Email | `admin@roanokemowers.com` |
| Password | `demo-admin-password` |

This login exists only inside your Codespace's demo database. It is never used on the live site.

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
