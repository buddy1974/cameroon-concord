#!/usr/bin/env node
/**
 * Manage newsroom grants (who may use the Telegram newsroom against this publication).
 *
 *   npm run newsroom:grant -- <telegramId> <viewer|contributor|editor|publisher> [displayName]
 *   npm run newsroom:grant -- <telegramId> revoke
 *
 * Upserts (and re-activates) a grant, or deactivates it on `revoke`.
 * Uses the DB in .env.local. Prints no credentials.
 */
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const ROLES = ['viewer', 'contributor', 'editor', 'publisher']
const [telegramId, action, ...nameParts] = process.argv.slice(2)
const displayName = nameParts.join(' ').trim().slice(0, 120) || null

if (!telegramId || !/^\d{1,20}$/.test(telegramId) || !action || (action !== 'revoke' && !ROLES.includes(action))) {
  console.error('Usage: newsroom-grant.mjs <telegramId> <viewer|contributor|editor|publisher|revoke> [displayName]')
  process.exit(1)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
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
  if (action === 'revoke') {
    const [res] = await conn.query(
      'UPDATE newsroom_grants SET active = FALSE, updated_at = NOW() WHERE telegram_user_id = ?', [telegramId])
    console.log(res.affectedRows ? `Grant for ${telegramId} deactivated.` : `No grant found for ${telegramId}.`)
  } else {
    await conn.query(
      `INSERT INTO newsroom_grants (telegram_user_id, role, active, display_name, created_at, updated_at)
       VALUES (?, ?, TRUE, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE role = VALUES(role), active = TRUE,
         display_name = COALESCE(VALUES(display_name), display_name), updated_at = NOW()`,
      [telegramId, action, displayName])
    console.log(`Grant for ${telegramId}: ${action} (active).`)
  }
} catch (err) {
  console.error(`Grant failed: ${err && err.code ? err.code : 'error'}`)
  process.exitCode = 1
} finally {
  await conn.end()
}
