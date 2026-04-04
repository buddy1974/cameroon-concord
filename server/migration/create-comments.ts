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
  await conn.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      article_id   INT UNSIGNED NOT NULL,
      parent_id    INT UNSIGNED,
      author_name  VARCHAR(100) NOT NULL,
      author_email VARCHAR(200) NOT NULL,
      body         TEXT NOT NULL,
      status       ENUM('pending','approved','spam') DEFAULT 'pending',
      ip_address   VARCHAR(45),
      user_agent   VARCHAR(512),
      cf_score     VARCHAR(10),
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_article (article_id),
      INDEX idx_status  (status, created_at),
      INDEX idx_parent  (parent_id)
    )
  `)
  console.log('✓ comments table created')
  conn.release()
  await pool.end()
}

main()
