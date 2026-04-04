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
    CREATE TABLE IF NOT EXISTS pwa_events (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      event      VARCHAR(20)  NOT NULL,
      user_agent TEXT,
      ip         VARCHAR(64),
      created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_event   (event),
      INDEX idx_created (created_at)
    )
  `)
  console.log('✓ pwa_events table created')
  conn.release()
  await pool.end()
}

main()
