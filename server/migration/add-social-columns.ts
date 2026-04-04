import { createPool } from 'mysql2/promise'
import { config } from 'dotenv'
config({ path: '.env.local' })

const pool = createPool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT ?? 3306),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl:      { rejectUnauthorized: false },
})

async function main() {
  const conn = await pool.getConnection()

  try {
    await conn.query('ALTER TABLE articles ADD COLUMN fb_posted_at DATETIME NULL')
    console.log('✓ fb_posted_at added')
  } catch (e: any) {
    console.log(`  fb_posted_at: ${e.message}`)
  }

  try {
    await conn.query('ALTER TABLE articles ADD COLUMN twitter_posted_at DATETIME NULL')
    console.log('✓ twitter_posted_at added')
  } catch (e: any) {
    console.log(`  twitter_posted_at: ${e.message}`)
  }

  // Migrate: mark id=35445 as FB posted (it already posted successfully)
  await conn.query('UPDATE articles SET fb_posted_at = NOW() WHERE id = 35445 AND fb_posted_at IS NULL')
  console.log('✓ id=35445 marked fb_posted_at')

  conn.release()
  await pool.end()
  console.log('Done.')
}

main()
