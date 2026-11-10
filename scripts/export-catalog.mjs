// Used by scripts/go-live.sh. Reads the scratch database the seed just filled and writes:
//   <dir>/catalog.sql    clears the live database's content tables and inserts everything
//   <dir>/photo-lists.tsv  content type + upload list (wrangler r2 bulk put format) per file type
//   <dir>/counts.json    how many models and photos the catalog has
// Usage: node scripts/export-catalog.mjs <scratch dir>
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

const out = ['PRAGMA defer_foreign_keys = true;']
for (const t of tables) out.push(`DELETE FROM ${q(t)};`)
for (const t of tables) {
  for (const row of db.prepare(`SELECT * FROM ${q(t)}`).all()) {
    const cols = Object.keys(row)
    out.push(`INSERT INTO ${q(t)} (${cols.map(q).join(', ')}) VALUES (${cols.map((c) => lit(row[c])).join(', ')});`)
  }
}
fs.writeFileSync(path.join(dir, 'catalog.sql'), out.join('\n') + '\n')

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
