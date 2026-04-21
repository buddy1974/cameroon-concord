import { mysqlTable, int, varchar, text, mysqlEnum, datetime } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const exileSubmissions = mysqlTable('exile_submissions', {
  id:        int('id', { unsigned: true }).autoincrement().primaryKey(),
  content:   text('content').notNull(),
  region:    varchar('region', { length: 100 }),
  category:  varchar('category', { length: 50 }).default('general'),
  status:    mysqlEnum('status', ['pending', 'reviewing', 'published', 'rejected']).default('pending'),
  ipHash:    varchar('ip_hash', { length: 64 }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
})
