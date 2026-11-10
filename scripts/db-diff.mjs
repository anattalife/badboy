// Compares two copies of the site database and writes the SQL that turns the first into the second.
// Used by scripts/on-live.sh to make a change on a local copy of the live database, then apply
// only what changed to the live one (one small import instead of thousands of slow round trips).
//   node scripts/db-diff.mjs <before.sqlite> <after.sqlite> <out.sql>
// Rows are matched by their primary key (rowid when a table has none). Deletes run child tables
// first, inserts/updates parent tables first, so foreign keys hold after every statement.
import fs from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

const [beforePath, afterPath, outPath] = process.argv.slice(2)
if (!outPath) throw new Error('Usage: node scripts/db-diff.mjs <before.sqlite> <after.sqlite> <out.sql>')
const before = new DatabaseSync(beforePath, { readOnly: true })
const after = new DatabaseSync(afterPath, { readOnly: true })

const internal = (t) => /^(sqlite_|_cf_|d1_)/.test(t)
const tablesOf = (db) =>
  db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all().map((r) => String(r.name)).filter((t) => !internal(t))
const beforeTables = new Set(tablesOf(before))
const tables = tablesOf(after)
const missing = tables.filter((t) => !beforeTables.has(t))
if (missing.length) throw new Error(`Schema differs (new tables: ${missing.join(', ')}). Run migrations instead.`)

const q = (n) => `"${n.replaceAll('"', '""')}"`
const lit = (v) => {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number' || typeof v === 'bigint') return String(v)
  if (v instanceof Uint8Array) return `X'${Buffer.from(v).toString('hex')}'`
  return `'${String(v).replaceAll("'", "''")}'`
}

// Parents first.
const parentsOf = new Map(
  tables.map((t) => [
    t,
    new Set(after.prepare(`SELECT "table" AS p FROM pragma_foreign_key_list(?)`).all(t).map((r) => String(r.p)).filter((p) => p !== t)),
  ]),
)
const order = []
const pending = new Set(tables)
while (pending.size) {
  const ready = [...pending].filter((t) => ![...parentsOf.get(t)].some((p) => pending.has(p)))
  if (!ready.length) throw new Error(`Foreign-key loop between: ${[...pending].join(', ')}`)
  for (const t of ready) (order.push(t), pending.delete(t))
}

const deletes = []
const upserts = []
let changed = 0
for (const t of order) {
  const pk = after.prepare(`SELECT name FROM pragma_table_info(?) WHERE pk > 0 ORDER BY pk`).all(t).map((r) => String(r.name))
  const keyCols = pk.length ? pk : ['rowid']
  const select = `SELECT ${pk.length ? '' : 'rowid AS rowid, '}* FROM ${q(t)}`
  const key = (row) => JSON.stringify(keyCols.map((c) => row[c]))
  const oldRows = new Map(before.prepare(select).all().map((r) => [key(r), r]))
  const newRows = new Map(after.prepare(select).all().map((r) => [key(r), r]))
  const where = (row) => keyCols.map((c) => `${q(c)} = ${lit(row[c])}`).join(' AND ')
  for (const [k, row] of oldRows) {
    if (!newRows.has(k)) (deletes.unshift(`DELETE FROM ${q(t)} WHERE ${where(row)};`), changed++)
  }
  for (const [k, row] of newRows) {
    const old = oldRows.get(k)
    const cols = Object.keys(row).filter((c) => pk.length || c !== 'rowid')
    if (old && cols.every((c) => lit(old[c]) === lit(row[c]))) continue
    // UPDATE, never INSERT OR REPLACE: a replace deletes the row first, which would cascade-delete
    // every child row pointing at it.
    if (old) {
      const sets = cols.filter((c) => lit(old[c]) !== lit(row[c])).map((c) => `${q(c)} = ${lit(row[c])}`)
      upserts.push(`UPDATE ${q(t)} SET ${sets.join(', ')} WHERE ${where(row)};`)
    } else {
      upserts.push(`INSERT INTO ${q(t)} (${cols.map(q).join(', ')}) VALUES (${cols.map((c) => lit(row[c])).join(', ')});`)
    }
    changed++
  }
}
// Deletes were collected parents-first and unshifted, so they now run children first.
fs.writeFileSync(outPath, ['PRAGMA defer_foreign_keys = true;', ...deletes, ...upserts].join('\n') + '\n')
console.log(`${changed} row changes (${deletes.length} deleted, ${upserts.length} added or changed).`)
