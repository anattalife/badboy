// Used by scripts/go-live.sh. Reads the scratch database the seed just filled and writes:
//   <dir>/rebuild.sql    drops the live database's tables and recreates them with the catalog
//   <dir>/photo-lists.tsv  content type + upload list (wrangler r2 bulk put format) per file type
//   <dir>/counts.json    how many models and photos the catalog has
// Usage: node scripts/export-catalog.mjs <scratch dir> [JSON file of the live database's tables]
import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const dir = path.resolve(process.argv[2] ?? '.go-live-db')
const d1Dir = path.join(dir, 'v3', 'd1')
const find = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name)
    return e.isDirectory() ? find(p) : e.name.endsWith('.sqlite') && e.name !== 'metadata.sqlite' ? [p] : []
  })
const files = find(d1Dir)
if (files.length !== 1) throw new Error(`Expected one database in ${d1Dir}, found ${files.length}`)
const db = new DatabaseSync(files[0], { readOnly: true })

const skip = (t) => t === 'payload_migrations' || /^(sqlite_|_cf_|d1_)/.test(t)
const tables = db
  .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`)
  .all()
  .map((r) => String(r.name))
  .filter((t) => !skip(t))

const lit = (v) => {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number' || typeof v === 'bigint') return String(v)
  if (v instanceof Uint8Array) return `X'${Buffer.from(v).toString('hex')}'`
  return `'${String(v).replaceAll("'", "''")}'`
}
const q = (name) => `"${name.replaceAll('"', '""')}"`

// Rebuild from scratch: drop every table the live database has, recreate the schema exactly as the
// scratch database has it, then insert all rows, migration records included. It runs as one import,
// so it either all happens or none of it does. The live tables come in as JSON [{name, sql}].
const internal = (t) => /^(sqlite_|_cf_|d1_)/.test(t)
const live = process.argv[3] && fs.existsSync(process.argv[3]) ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8')) : []
const allTables = [...tables, 'payload_migrations']
const sqlOf = new Map()
for (const r of db.prepare(`SELECT name, sql FROM sqlite_master WHERE type = 'table'`).all()) sqlOf.set(String(r.name), String(r.sql ?? ''))
for (const r of live) sqlOf.set(String(r.name), String(r.sql ?? ''))
const toDrop = [...new Set([...live.map((r) => String(r.name)), ...allTables])].filter((t) => !internal(t))
// A table can only be dropped once nothing still standing points at it, so drop the tables that
// reference others first.
const refs = new Map(
  toDrop.map((t) => [t, new Set([...sqlOf.get(t)?.matchAll(/REFERENCES\s+[`"']?([\w]+)/gi) ?? []].map((m) => m[1]).filter((p) => p !== t))]),
)
const dropOrder = []
const remaining = new Set(toDrop)
while (remaining.size) {
  // Drop a table no remaining table references; if there's a loop, just take the first.
  const next = [...remaining].find((t) => ![...remaining].some((o) => o !== t && refs.get(o)?.has(t))) ?? [...remaining][0]
  dropOrder.push(next)
  remaining.delete(next)
}
const out = ['PRAGMA defer_foreign_keys = true;']
for (const t of dropOrder) out.push(`DROP TABLE IF EXISTS ${q(t)};`)
const schema = db
  .prepare(`SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND type IN ('table', 'index')`)
  .all()
  .filter((r) => !/^(sqlite_|_cf_|d1_)/.test(String(r.name)))
for (const r of schema.filter((r) => r.type === 'table')) out.push(`${r.sql};`)
for (const r of schema.filter((r) => r.type === 'index')) out.push(`${r.sql};`)
// Cloudflare may run a large import in several pieces, so the PRAGMA above can't be relied on:
// insert parent tables before the tables that point at them, so every row is valid when it lands.
const parentsOf = new Map(
  allTables.map((t) => [
    t,
    new Set(db.prepare(`SELECT "table" AS parent FROM pragma_foreign_key_list(?)`).all(t).map((r) => String(r.parent)).filter((p) => p !== t)),
  ]),
)
const insertOrder = []
const pending = new Set(allTables)
while (pending.size) {
  const ready = [...pending].filter((t) => ![...parentsOf.get(t)].some((p) => pending.has(p)))
  if (!ready.length) throw new Error(`Tables point at each other in a loop: ${[...pending].join(', ')}`)
  for (const t of ready) {
    insertOrder.push(t)
    pending.delete(t)
  }
}
for (const t of insertOrder) {
  for (const row of db.prepare(`SELECT * FROM ${q(t)} ORDER BY rowid`).all()) {
    const cols = Object.keys(row)
    out.push(`INSERT INTO ${q(t)} (${cols.map(q).join(', ')}) VALUES (${cols.map((c) => lit(row[c])).join(', ')});`)
  }
}
fs.writeFileSync(path.join(dir, 'rebuild.sql'), out.join('\n') + '\n')

// Photos: the seed uploads the files in src/seed/media under their own names.
const mediaDir = path.resolve('src/seed/media')
const allMedia = fs.readdirSync(mediaDir, { recursive: true }).map(String)
const photos = db
  .prepare(`SELECT filename FROM media WHERE filename IS NOT NULL`)
  .all()
  .map((r) => {
    const name = String(r.filename)
    const rel = allMedia.find((f) => path.basename(f) === name)
    if (!rel) throw new Error(`Photo file not found in src/seed/media: ${name}`)
    return { key: name, file: path.join(mediaDir, rel) }
  })
// One upload list per file type, so each photo is stored with the right content type.
const TYPES = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.avif': 'image/avif' }
const groups = {}
for (const p of photos) {
  const type = TYPES[path.extname(p.key).toLowerCase()]
  if (!type) throw new Error(`Unexpected photo type: ${p.key}`)
  ;(groups[type] ??= []).push(p)
}
const lists = Object.entries(groups).map(([type, items], i) => {
  const file = path.join(dir, `photos-${i}.json`)
  fs.writeFileSync(file, JSON.stringify(items, null, 1))
  return { type, file }
})
fs.writeFileSync(path.join(dir, 'photo-lists.tsv'), lists.map((l) => `${l.type}\t${l.file}`).join('\n') + '\n')

const models = Number(db.prepare(`SELECT count(*) AS n FROM models`).get().n)
fs.writeFileSync(path.join(dir, 'counts.json'), JSON.stringify({ models, photos: photos.length }))
console.log(`Catalog ready: ${models} models, ${photos.length} photos, ${out.length} statements.`)
