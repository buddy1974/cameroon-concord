import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

const globalForDb = globalThis as unknown as {
  pool: mysql.Pool | undefined
}

const pool = globalForDb.pool ?? mysql.createPool({
  host:               process.env.DB_HOST!,
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER!,
  password:           process.env.DB_PASSWORD!,
  database:           process.env.DB_NAME!,
  waitForConnections: true,
  connectionLimit:    2,
  queueLimit:         10,
  connectTimeout:     10000,
  ssl:                { rejectUnauthorized: false },
})

globalForDb.pool = pool

export const db = drizzle(pool, { schema, mode: 'default' })
export type DB = typeof db
