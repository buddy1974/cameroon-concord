import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

const globalForDb = globalThis as unknown as {
  pool: mysql.Pool | undefined
}

const REQUIRED_DB_ENV = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'] as const
const missingDbEnv = REQUIRED_DB_ENV.filter(key => !process.env[key])
if (missingDbEnv.length > 0) {
  throw new Error(`Missing required database environment variables: ${missingDbEnv.join(', ')}`)
}

const pool = globalForDb.pool ?? mysql.createPool({
  host:               process.env.DB_HOST,
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    3,   // keep low for serverless — each Vercel instance gets its own pool
  queueLimit:         30,  // larger buffer so bursts don't immediately hard-fail
  connectTimeout:     3000, // fail fast — 10s was holding slots open under DB stress
  ssl:                { rejectUnauthorized: false },
})

globalForDb.pool = pool

export const db = drizzle(pool, { schema, mode: 'default' })
export type DB = typeof db
