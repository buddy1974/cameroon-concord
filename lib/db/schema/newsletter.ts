import {
  mysqlTable, int, varchar, text,
  datetime, mysqlEnum, index,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const newsletterSubscribers = mysqlTable('newsletter_subscribers', {
  id:          int('id', { unsigned: true }).autoincrement().primaryKey(),
  email:       varchar('email', { length: 200 }).notNull().unique(),
  token:       varchar('token', { length: 64 }).notNull(),
  status:      mysqlEnum('status', ['pending','confirmed','unsubscribed']).default('pending'),
  createdAt:   datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  emailIdx: index('idx_email').on(t.email),
  tokenIdx: index('idx_token').on(t.token),
}))

export const newsletterSends = mysqlTable('newsletter_sends', {
  id:             int('id', { unsigned: true }).autoincrement().primaryKey(),
  subject:        varchar('subject', { length: 200 }).notNull(),
  body:           text('body').notNull(),
  sentBy:         varchar('sent_by', { length: 100 }),
  recipientCount: int('recipient_count').default(0),
  sentAt:         datetime('sent_at').default(sql`CURRENT_TIMESTAMP`),
})

export const newsletterDrafts = mysqlTable('newsletter_drafts', {
  id:             int('id', { unsigned: true }).autoincrement().primaryKey(),
  subject:        varchar('subject', { length: 200 }),
  previewText:    varchar('preview_text', { length: 300 }),
  template:       mysqlEnum('template', ['breaking','digest','weekly','most_read']).default('digest'),
  articleIds:     text('article_ids'),
  htmlBody:       text('html_body'),
  status:         mysqlEnum('status', ['draft','sent','scheduled']).default('draft'),
  recipientCount: int('recipient_count').default(0),
  scheduledAt:    datetime('scheduled_at'),
  sentAt:         datetime('sent_at'),
  createdAt:      datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
})
