import {
  mysqlTable, int, bigint, datetime,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const articleHits = mysqlTable('article_hits', {
  articleId: int('article_id', { unsigned: true }).primaryKey(),
  hits:      bigint('hits', { mode: 'number', unsigned: true }).default(0),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`),
})
