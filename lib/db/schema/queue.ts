import {
  mysqlTable, int, json, text,
  datetime, mysqlEnum, index,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const publishingQueue = mysqlTable('publishing_queue', {
  id:          int('id', { unsigned: true }).autoincrement().primaryKey(),
  source:      mysqlEnum('source', ['manual','api','mobile','script','ai','webhook']).default('manual'),
  payload:     json('payload').notNull(),
  status:      mysqlEnum('status', ['pending','processing','published','failed']).default('pending'),
  articleId:   int('article_id', { unsigned: true }),
  error:       text('error'),
  createdAt:   datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  processedAt: datetime('processed_at'),
}, (t) => ({
  statusIdx: index('idx_status').on(t.status, t.createdAt),
}))

export const publishLog = mysqlTable('publish_log', {
  id:        int('id', { unsigned: true }).autoincrement().primaryKey(),
  articleId: int('article_id', { unsigned: true }),
  action:    mysqlEnum('action', ['created','published','scheduled','archived','ai_draft','social_posted']),
  source:    mysqlEnum('source', ['web','api','mobile','script','ai']),
  metadata:  json('metadata'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  articleIdx: index('idx_article').on(t.articleId),
}))
