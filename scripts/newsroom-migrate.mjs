#!/usr/bin/env node
/**
 * Applies lib/db/migrations/newsroom/*.sql (CREATE TABLE IF NOT EXISTS only — idempotent).
 *
 *   npm run newsroom:migrate             apply against the DB in .env.local
 *   npm run newsroom:migrate -- --dry-run   print the SQL, touch nothing
 *
 * Prints table names and status only — never credentials.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'lib', 'db', 'migrations', 'newsroom')
const dryRun = process.argv.includes('--dry-run')

const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
const statements = files.flatMap((f) =>
  readFileSync(join(dir, f), 'utf8')
    .split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
    .split(';').map((s) => s.trim()).filter(Boolean)
    .map((sql) => ({ file: f, sql })),
)

if (dryRun) {
  for (const s of statements) console.log(`-- ${s.file}\n${s.sql};\n`)
  console.log(`[dry-run] ${statements.length} statement(s), nothing executed.`)
  process.exit(0)
}

for (const unsafe of statements) {
  if (!/^CREATE TABLE IF NOT EXISTS /i.test(unsafe.sql)) {
    console.error(`Refusing to run non-additive statement from ${unsafe.file}.`)
    process.exit(1)
  }
}

dotenv.config({ path: join(root, '.env.local'), quiet: true })
const missing = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'].filter((k) => !process.env[k])
if (missing.length) {
  console.error(`Missing DB environment variables: ${missing.join(', ')}`)
  process.exit(1)
}

const mysql = (await import('mysql2/promise')).default
const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  connectTimeout: 10000,
})

try {
  for (const s of statements) {
    const table = s.sql.match(/CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?/i)?.[1] ?? '?'
    const [before] = await conn.query('SHOW TABLES LIKE ?', [table])
    await conn.query(s.sql)
    console.log(`${table}: ${before.length ? 'already present' : 'created'}`)
  }
  console.log('Newsroom migration complete.')
} catch (err) {
  console.error(`Migration failed: ${err && err.code ? err.code : 'error'}`)
  process.exitCode = 1
} finally {
  await conn.end()
}
