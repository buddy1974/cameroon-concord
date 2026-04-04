import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { createPool } from 'mysql2/promise'
import { config } from 'dotenv'
import { appendFileSync, writeFileSync, existsSync, readFileSync } from 'fs'
import * as readline from 'readline'

config({ path: '.env.local' })

const LOG_FILE = 'server/workers/telegram-ingest.log'
const SESSION_FILE = 'server/workers/telegram-session.txt'

const API_ID = 32158158
const API_HASH = '23610d8a2d6c430e364389f08a179beb'

const CHANNELS = [
  '@NZUIMANTO1',
  '@LeTgvdeLindo',
  '@BusinessCameroon',
  '@JeuneAfriqueNews'
]

const LIMIT_PER_CHANNEL = 20

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(line)
  appendFileSync(LOG_FILE, line + '\n')
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0') +
    Math.abs(hash * 31).toString(16).padStart(8, '0') +
    Math.abs(hash * 17 + str.length).toString(16).padStart(8, '0')
}

function esc(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  return "'" + String(v).replace(/'/g, "''").replace(/\\/g, '\\\\') + "'"
}

async function main() {
  writeFileSync(LOG_FILE, `[${new Date().toISOString()}] Starting Telegram ingest\n`)

  // Load or create session
  const sessionStr = existsSync(SESSION_FILE)
    ? readFileSync(SESSION_FILE, 'utf8').trim()
    : ''
  const session = new StringSession(sessionStr)

  const client = new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: 3,
  })

  // Auth flow — only needed on first run
  await client.start({
    phoneNumber: async () => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
      return new Promise(resolve => rl.question('Enter your Telegram phone number: ', ans => { rl.close(); resolve(ans) }))
    },
    password: async () => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
      return new Promise(resolve => rl.question('Enter 2FA password (if any): ', ans => { rl.close(); resolve(ans) }))
    },
    phoneCode: async () => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
      return new Promise(resolve => rl.question('Enter the code you received: ', ans => { rl.close(); resolve(ans) }))
    },
    onError: (err: Error) => log('Auth error: ' + err.message),
  })

  // Save session for future runs
  const savedSession = client.session.save() as unknown as string
  writeFileSync(SESSION_FILE, savedSession)
  log('Session saved — future runs will not require auth')

  // Connect to DB (Hostinger MariaDB — uses DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME)
  const pool = createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    connectionLimit: 2,
  })

  let inserted = 0
  let skipped = 0

  for (const channel of CHANNELS) {
    try {
      log(`Fetching ${channel}...`)
      const messages = await client.getMessages(channel, { limit: LIMIT_PER_CHANNEL })

      for (const msg of messages) {
        const text = msg.message || ''
        if (!text || text.length < 30) continue

        const hashInput = (text.substring(0, 100) + channel).toLowerCase().replace(/\s+/g, '')
        const content_hash = simpleHash(hashInput)

        const raw_title = text.substring(0, 200).split('\n')[0]
        const raw_body = text.substring(0, 5000)

        const query = `INSERT INTO ingested_content (source_name, source_url, content_hash, raw_title, raw_body, raw_image_url, language, status) VALUES (${esc('telegram_' + channel.replace('@', ''))}, ${esc(null)}, ${esc(content_hash)}, ${esc(raw_title)}, ${esc(raw_body)}, NULL, 'fr', 'pending') ON CONFLICT (content_hash) DO NOTHING`

        const conn = await pool.getConnection()
        const [result] = await conn.query(query) as any
        conn.release()

        if (result.affectedRows > 0) {
          inserted++
        } else {
          skipped++
        }
      }

      log(`${channel}: done`)
    } catch (e) {
      log(`ERR ${channel}: ${e}`)
    }
  }

  log(`DONE. inserted=${inserted} skipped=${skipped}`)
  await client.disconnect()
  await pool.end()
  process.exit(0)
}

main()
