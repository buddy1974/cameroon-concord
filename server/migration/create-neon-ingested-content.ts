import { Pool } from 'pg'
import { config } from 'dotenv'
config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ingested_content (
      id SERIAL PRIMARY KEY,
      source_name VARCHAR(100) NOT NULL,
      source_url TEXT,
      content_hash VARCHAR(64) UNIQUE NOT NULL,
      raw_title TEXT,
      raw_body TEXT,
      raw_image_url TEXT,
      language VARCHAR(10) DEFAULT 'fr',
      status VARCHAR(20) DEFAULT 'pending',
      reject_reason TEXT,
      cc_article_id INTEGER,
      ingested_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  console.log('✓ ingested_content table created on Neon')
  await pool.end()
}

main()
