// Applies new database migrations to the LIVE database as one D1 import, instead of running
// `payload migrate` over the remote connection (slow, and it drops queries).
//
//   node scripts/migrate-live.mjs            shows what would run
//   node scripts/migrate-live.mjs --apply    runs it
//
// Only migrations whose up() is nothing but `await db.run(sql`...`)` statements (what
// `payload migrate:create` generates) can be applied this way; anything else stops with a message.
// Needs Cloudflare access (CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID, or `wrangler login`).
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const apply = process.argv.includes('--apply')
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const wrangler = fs.readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8')
const database = wrangler.match(/"database_name":\s*"([^"]+)"/)[1]
const wr = (...args) =>
  execFileSync('pnpm', ['-s', 'exec', 'wrangler', ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, CLOUDFLARE_ENV: '' },
    stdio: ['ignore', 'pipe', 'inherit'],
  })

const out = wr('d1', 'execute', database, '--remote', '--json', '--command', 'SELECT name, batch FROM payload_migrations')
const rows = JSON.parse(out.slice(out.indexOf('[')))[0].results
const applied = new Set(rows.map((r) => r.name))
const batch = Math.max(0, ...rows.map((r) => Number(r.batch) || 0)) + 1

const index = fs.readFileSync(path.join(root, 'src/migrations/index.ts'), 'utf8')
const names = [...index.matchAll(/name:\s*'([^']+)'/g)].map((m) => m[1])
const pending = names.filter((n) => !applied.has(n))
if (!pending.length) {
  console.log('The live database is up to date.')
  process.exit(0)
}

const statements = ['PRAGMA defer_foreign_keys = true;']
for (const name of pending) {
  const src = fs.readFileSync(path.join(root, 'src/migrations', `${name}.ts`), 'utf8')
  const up = src.match(/export async function up\([^)]*\)[^{]*\{([\s\S]*?)\n\}/)
  if (!up) throw new Error(`${name}: couldn't find up().`)
  const body = up[1]
  const runs = [...body.matchAll(/await db\.run\(sql`([\s\S]*?)`\)\s*;?/g)]
  const rest = body.replace(/await db\.run\(sql`[\s\S]*?`\)\s*;?/g, '').replace(/\/\/.*$/gm, '').trim()
  if (rest) throw new Error(`${name}: up() does more than run SQL; run it with \`payload migrate\` instead.\n${rest.slice(0, 300)}`)
  for (const [, sqlText] of runs) {
    if (sqlText.includes('${')) throw new Error(`${name}: SQL uses template values; run it with \`payload migrate\` instead.`)
    const s = sqlText.replace(/\\`/g, '`').trim()
    statements.push(s.endsWith(';') ? s : `${s};`)
  }
  const now = new Date().toISOString()
  statements.push(
    `INSERT INTO payload_migrations (name, batch, updated_at, created_at) VALUES ('${name}', ${batch}, '${now}', '${now}');`,
  )
  console.log(`${apply ? 'Applying' : 'Would apply'}: ${name} (${runs.length} statements)`)
}

const file = path.join(root, '.migrate-live.sql')
fs.writeFileSync(file, statements.join('\n') + '\n')
if (!apply) {
  console.log(`SQL written to ${path.relative(root, file)}. Run with --apply to change the live database.`)
  process.exit(0)
}
wr('d1', 'execute', database, '--remote', '--file', file, '-y')
fs.rmSync(file)
console.log('Done.')
