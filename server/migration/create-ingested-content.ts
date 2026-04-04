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
    CREATE TABLE IF NOT EXISTS ingested_content (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      source_name   VARCHAR(100)  NOT NULL,
      source_url    VARCHAR(500)  NULL,
      content_hash  VARCHAR(64)   NOT NULL,
      raw_title     VARCHAR(500)  NOT NULL,
      raw_body      TEXT          NOT NULL,
      raw_image_url VARCHAR(500)  NULL,
      language      VARCHAR(10)   NOT NULL DEFAULT 'fr',
      status        VARCHAR(20)   NOT NULL DEFAULT 'pending',
      created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_content_hash (content_hash)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  console.log('✓ ingested_content table created (or already exists)')
  conn.release()
  await pool.end()
}

main()
