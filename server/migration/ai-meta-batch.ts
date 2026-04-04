import Anthropic from '@anthropic-ai/sdk'
import { createPool } from 'mysql2/promise'
import { appendFileSync, writeFileSync } from 'fs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const LOG_FILE = 'server/migration/ai-meta-batch.log'
const DELAY_MS = 1200
const BATCH_REPORT_EVERY = 50

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const pool = createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 2,
  waitForConnections: true,
})

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(line)
  appendFileSync(LOG_FILE, line + '\n')
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function generateMeta(
  title: string,
  body: string
): Promise<{ meta_title: string; meta_desc: string } | null> {
  const bodySnippet = stripHtml(body).slice(0, 500)
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Generate SEO meta for this Cameroon news article.
Return ONLY valid JSON. No markdown. No explanation.
Title: ${title}
Body: ${bodySnippet}
Format: {"meta_title":"max 60 chars, include Cameroon if relevant","meta_desc":"max 155 chars, compelling summary"}`,
      },
    ],
  })
  const block = msg.content?.[0]
  if (!block || block.type !== 'text' || !(block as any).text) {
    throw new Error('Empty or non-text response from API')
  }
  const text = (block as { type: string; text: string }).text.trim()
  const clean = text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(clean)
  return {
    meta_title: String(parsed.meta_title).slice(0, 60),
    meta_desc: String(parsed.meta_desc).slice(0, 155),
  }
}

async function main() {
  // Initialize log file
  writeFileSync(LOG_FILE, `[${new Date().toISOString()}] Starting AI meta batch\n`)

  const conn = await pool.getConnection()
  const [rows] = await conn.query<any[]>(
    `SELECT id, title, body FROM articles
     WHERE (meta_title IS NULL OR meta_title = '')
     AND status = 'published'
     ORDER BY legacy_hits DESC`
  )
  conn.release()

  log(`Total articles to process: ${rows.length}`)

  let ok = 0
  let fail = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const meta = await generateMeta(row.title ?? '', row.body ?? '')
      if (!meta) throw new Error('null response')

      const c = await pool.getConnection()
      await c.query(
        'UPDATE articles SET meta_title = ?, meta_desc = ? WHERE id = ?',
        [meta.meta_title, meta.meta_desc, row.id]
      )
      c.release()

      ok++
      if (i % BATCH_REPORT_EVERY === 0) {
        log(`[${i}/${rows.length}] OK id=${row.id}: ${meta.meta_title}`)
      }
    } catch (e) {
      fail++
      log(`ERR id=${row.id} title="${row.title?.slice(0, 40)}": ${e}`)
    }

    await new Promise((r) => setTimeout(r, DELAY_MS))
  }

  log(`DONE. OK=${ok} FAIL=${fail} TOTAL=${rows.length}`)
  await pool.end()
  process.exit(0)
}

main()
