import {
  mysqlTable, int, text, varchar, json,
  datetime, mysqlEnum, index,
} from 'drizzle-orm/mysql-core'

export const socialQueue = mysqlTable('social_queue', {
  id:             int('id', { unsigned: true }).autoincrement().primaryKey(),
  articleId:      int('article_id', { unsigned: true }).notNull(),
  platform:       mysqlEnum('platform', ['twitter','facebook','whatsapp','instagram','telegram']),
  content:        text('content'),
  status:         mysqlEnum('status', ['pending','sent','failed']).default('pending'),
  scheduledAt:    datetime('scheduled_at'),
  sentAt:         datetime('sent_at'),
  platformPostId: varchar('platform_post_id', { length: 255 }),
  response:       json('response'),
  error:          text('error'),
}, (t) => ({
  statusIdx:  index('idx_status_sched').on(t.status, t.scheduledAt),
  articleIdx: index('idx_article').on(t.articleId),
}))
