import {
  mysqlTable, int, varchar, text,
  boolean, datetime, index,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const authors = mysqlTable('authors', {
  id:        int('id', { unsigned: true }).autoincrement().primaryKey(),
  slug:      varchar('slug', { length: 120 }).notNull().unique(),
  name:      varchar('name', { length: 120 }).notNull(),
  bio:       text('bio'),
  avatarUrl: varchar('avatar_url', { length: 512 }),
  email:     varchar('email', { length: 200 }).unique(),
  twitter:   varchar('twitter', { length: 100 }),
  isAi:      boolean('is_ai').default(false),
  apiKey:    varchar('api_key', { length: 64 }).unique(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  emailIdx: index('idx_email').on(t.email),
}))
