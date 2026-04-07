import {
  mysqlTable, int, varchar, text,
  boolean, datetime, mysqlEnum, index, tinyint,
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
  cfScore:       varchar('cf_score', { length: 10 }),
  flagged:       tinyint('flagged').default(0),
  flagReason:    varchar('flag_reason', { length: 500 }),
  authorIsAdmin: tinyint('author_is_admin').default(0),
  notifyEmail:   tinyint('notify_email').default(0),
  createdAt:     datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  articleIdx: index('idx_article').on(t.articleId),
  statusIdx:  index('idx_status').on(t.status, t.createdAt),
  parentIdx:  index('idx_parent').on(t.parentId),
}))

export const commentBans = mysqlTable('comment_bans', {
  id:        int('id', { unsigned: true }).autoincrement().primaryKey(),
  type:      mysqlEnum('type', ['ip','email']).notNull(),
  value:     varchar('value', { length: 200 }).notNull(),
  reason:    varchar('reason', { length: 500 }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  valueIdx: index('idx_value').on(t.type, t.value),
}))
