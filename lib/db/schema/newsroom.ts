/**
 * Newsroom API v1 tables (TM ↔ publication contract, see docs/newsroom-api.md).
 * Additive only — nothing here alters the existing `articles` schema.
 * The matching raw SQL lives in lib/db/migrations/newsroom/0001_newsroom.sql.
 */
import {
  mysqlTable, bigint, int, varchar, char, longtext, boolean,
  datetime, mysqlEnum, index, json, primaryKey,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const NEWSROOM_ROLES = ['viewer', 'contributor', 'editor', 'publisher'] as const

export const newsroomGrants = mysqlTable('newsroom_grants', {
  telegramUserId: bigint('telegram_user_id', { mode: 'bigint', unsigned: true }).primaryKey(),
  role:           mysqlEnum('role', NEWSROOM_ROLES).notNull(),
  active:         boolean('active').notNull().default(true),
  displayName:    varchar('display_name', { length: 120 }),
  createdAt:      datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt:      datetime('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const newsroomNonces = mysqlTable('newsroom_nonces', {
  nonce:     char('nonce', { length: 32 }).primaryKey(),
  expiresAt: datetime('expires_at').notNull(),
}, (t) => ({
  expiresIdx: index('idx_newsroom_nonces_expires').on(t.expiresAt),
}))

export const newsroomIdempotency = mysqlTable('newsroom_idempotency', {
  idemKey:      varchar('idem_key', { length: 200 }).notNull(),
  actor:        varchar('actor', { length: 40 }).notNull(),
  method:       varchar('method', { length: 10 }).notNull(),
  path:         varchar('path', { length: 255 }).notNull(),
  requestHash:  char('request_hash', { length: 64 }).notNull(),
  statusCode:   int('status_code').notNull(),
  responseJson: longtext('response_json'),
  createdAt:    datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  pk:         primaryKey({ columns: [t.idemKey, t.actor] }),
  createdIdx: index('idx_newsroom_idem_created').on(t.createdAt),
}))

export const newsroomAudit = mysqlTable('newsroom_audit', {
  id:             bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  requestId:      varchar('request_id', { length: 64 }).notNull(),
  actor:          varchar('actor', { length: 40 }).notNull(),
  operation:      varchar('operation', { length: 40 }).notNull(),
  articleId:      int('article_id', { unsigned: true }),
  changedFields:  json('changed_fields').$type<string[]>(),
  idempotencyKey: varchar('idempotency_key', { length: 200 }),
  result:         mysqlEnum('result', ['ok', 'denied', 'error']).notNull(),
  errorCode:      varchar('error_code', { length: 40 }),
  createdAt:      datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  articleIdx:      index('idx_newsroom_audit_article').on(t.articleId),
  actorCreatedIdx: index('idx_newsroom_audit_actor_created').on(t.actor, t.createdAt),
  requestIdx:      index('idx_newsroom_audit_request').on(t.requestId),
}))

export const newsroomArticleOrigins = mysqlTable('newsroom_article_origins', {
  articleId:      int('article_id', { unsigned: true }).primaryKey(),
  telegramUserId: bigint('telegram_user_id', { mode: 'bigint', unsigned: true }).notNull(),
  createdAt:      datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
})
