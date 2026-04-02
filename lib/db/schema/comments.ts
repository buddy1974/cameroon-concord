import {
  mysqlTable, int, varchar, text,
  boolean, datetime, mysqlEnum, index,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const comments = mysqlTable('comments', {
  id:          int('id', { unsigned: true }).autoincrement().primaryKey(),
  articleId:   int('article_id', { unsigned: true }).notNull(),
  parentId:    int('parent_id', { unsigned: true }),
  authorName:  varchar('author_name', { length: 100 }).notNull(),
  authorEmail: varchar('author_email', { length: 200 }).notNull(),
  body:        text('body').notNull(),
  status:      mysqlEnum('status', ['pending','approved','spam']).default('pending'),
  ipAddress:   varchar('ip_address', { length: 45 }),
  userAgent:   varchar('user_agent', { length: 512 }),
  cfScore:     varchar('cf_score', { length: 10 }),
  createdAt:   datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  articleIdx: index('idx_article').on(t.articleId),
  statusIdx:  index('idx_status').on(t.status, t.createdAt),
  parentIdx:  index('idx_parent').on(t.parentId),
}))
