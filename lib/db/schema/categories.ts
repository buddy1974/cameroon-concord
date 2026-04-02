import {
  mysqlTable, int, varchar, text,
  tinyint, datetime, index,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const categories = mysqlTable('categories', {
  id:          int('id', { unsigned: true }).autoincrement().primaryKey(),
  legacyId:    int('legacy_id', { unsigned: true }),
  slug:        varchar('slug', { length: 120 }).notNull().unique(),
  name:        varchar('name', { length: 120 }).notNull(),
  parentId:    int('parent_id', { unsigned: true }),
  description: text('description'),
  metaTitle:   varchar('meta_title', { length: 160 }),
  metaDesc:    varchar('meta_desc', { length: 320 }),
  sortOrder:   tinyint('sort_order').default(0),
  createdAt:   datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  legacyIdx: index('idx_legacy').on(t.legacyId),
  parentIdx: index('idx_parent').on(t.parentId),
}))
