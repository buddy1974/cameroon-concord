import { TwitterApi } from 'twitter-api-v2'
import { createPool } from 'mysql2/promise'
import { appendFileSync, writeFileSync } from 'fs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const LOG_FILE = 'server/workers/social-post.log'

// ─── Startup guard ────────────────────────────────────────────────────────────
const REQUIRED_VARS = [
  'FB_PAGE_ID',
  'FB_PAGE_TOKEN',
  'TWITTER_API_KEY',
  'TWITTER_API_SECRET',
  'TWITTER_ACCESS_TOKEN',
  'TWITTER_ACCESS_SECRET',
] as const

const missing = REQUIRED_VARS.filter(v => !process.env[v])
if (missing.length > 0) {
  console.error(`[social-post] Missing env vars: ${missing.join(', ')}`)
  console.error('[social-post] Add them to .env.local and retry.')
  process.exit(1)
}

// ─── Config ───────────────────────────────────────────────────────────────────
const FB_PAGE_ID      = process.env.FB_PAGE_ID!
const FB_ACCESS_TOKEN = process.env.FB_PAGE_TOKEN!

const twitter = new TwitterApi({
  appKey:            process.env.TWITTER_API_KEY!,
  appSecret:         process.env.TWITTER_API_SECRET!,
  accessToken:       process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret:      process.env.TWITTER_ACCESS_SECRET!,
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cameroon-concord.com'

const pool = createPool({
  host:              process.env.DB_HOST,
  port:              Number(process.env.DB_PORT ?? 3306),
  user:              process.env.DB_USER,
  password:          process.env.DB_PASSWORD,
  database:          process.env.DB_NAME,
  connectionLimit:   2,
  waitForConnections: true,
  ssl:               { rejectUnauthorized: false },
})

// ─── Logging ──────────────────────────────────────────────────────────────────
function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(line)
  appendFileSync(LOG_FILE, line + '\n')
}

// ─── Facebook ─────────────────────────────────────────────────────────────────
async function postToFacebook(article: {
  title: string
  excerpt: string | null
  slug: string
  category: string
}): Promise<void> {
  const url     = `${SITE_URL}/${article.category}/${article.slug}`
  const message = `${article.title}\n\n${article.excerpt ?? ''}\n\n${url}`

  const endpoint = `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/feed`
  const res = await fetch(endpoint, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      message,
      link:         url,
      access_token: FB_ACCESS_TOKEN,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Facebook API ${res.status}: ${body}`)
  }

  const data = await res.json() as { id?: string }
  log(`FB posted id=${data.id} — ${article.title.slice(0, 60)}`)
}

// ─── Twitter / X ──────────────────────────────────────────────────────────────
async function postToTwitter(article: {
  title: string
  slug: string
  category: string
}): Promise<void> {
  const url  = `${SITE_URL}/${article.category}/${article.slug}`
  // Twitter limit: 280 chars. Reserve 23 for shortened URL + space.
  const max  = 280 - 24
  const text = article.title.length <= max
    ? `${article.title} ${url}`
    : `${article.title.slice(0, max - 1)}… ${url}`

  const { data } = await twitter.v2.tweet(text)
  log(`Twitter posted id=${data.id} — ${article.title.slice(0, 60)}`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  writeFileSync(LOG_FILE, `[${new Date().toISOString()}] Starting social-post worker\n`)

  // Fetch articles published in the last 24 hours not yet posted to either platform.
  // Columns: fb_posted_at, twitter_posted_at — each tracked independently.
  const conn = await pool.getConnection()
  const [rows] = await conn.query<any[]>(`
    SELECT
      a.id,
      a.title,
      a.excerpt,
      a.slug,
      c.slug AS category,
      a.fb_posted_at,
      a.twitter_posted_at
    FROM articles a
    JOIN categories c ON c.id = a.category_id
    WHERE a.status = 'published'
      AND (a.fb_posted_at IS NULL OR a.twitter_posted_at IS NULL)
      AND a.published_at >= NOW() - INTERVAL 24 HOUR
    ORDER BY a.published_at DESC
    LIMIT 20
  `)
  conn.release()

  if (rows.length === 0) {
    log('No new articles to post.')
    await pool.end()
    return
  }

  log(`Found ${rows.length} article(s) to post.`)

  let ok = 0
  let fail = 0

  for (const row of rows) {
    let anyOk = false

    if (!row.fb_posted_at) {
      try {
        await postToFacebook(row)
        const c = await pool.getConnection()
        await c.query('UPDATE articles SET fb_posted_at = NOW() WHERE id = ?', [row.id])
        c.release()
        anyOk = true
      } catch (err) {
        fail++
        log(`ERR FB id=${row.id}: ${err}`)
      }
    }

    if (!row.twitter_posted_at) {
      try {
        await postToTwitter(row)
        const c = await pool.getConnection()
        await c.query('UPDATE articles SET twitter_posted_at = NOW() WHERE id = ?', [row.id])
        c.release()
        anyOk = true
      } catch (err: any) {
        fail++
        const detail = err?.data ? JSON.stringify(err.data) : String(err)
        log(`ERR Twitter id=${row.id}: ${detail}`)
      }
    }

    if (anyOk) ok++

    // Polite delay between posts
    await new Promise(r => setTimeout(r, 2000))
  }

  log(`DONE. OK=${ok} FAIL=${fail} TOTAL=${rows.length}`)
  await pool.end()
  process.exit(0)
}

main()
