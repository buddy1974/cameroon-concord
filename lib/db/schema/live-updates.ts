import { mysqlTable, int, text, varchar, datetime } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const liveUpdates = mysqlTable('live_updates', {
  id:        int('id', { unsigned: true }).autoincrement().primaryKey(),
  articleId: int('article_id', { unsigned: true }).notNull(),
  content:   text('content').notNull(),
  label:     varchar('label', { length: 100 }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
})
