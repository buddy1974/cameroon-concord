import { mysqlTable, int, varchar, datetime, index } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const articleReactions = mysqlTable('article_reactions', {
  id:        int('id', { unsigned: true }).autoincrement().primaryKey(),
  articleId: int('article_id', { unsigned: true }).notNull(),
  reaction:  varchar('reaction', { length: 20 }).notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  articleIdx: index('idx_article_id').on(t.articleId),
}))
