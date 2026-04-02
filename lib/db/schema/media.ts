import {
  mysqlTable, int, varchar, text, datetime, index,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const media = mysqlTable('media', {
  id:         int('id', { unsigned: true }).autoincrement().primaryKey(),
  r2Key:      varchar('r2_key', { length: 512 }).notNull(),
  cdnUrl:     varchar('cdn_url', { length: 1024 }).notNull(),
  mimeType:   varchar('mime_type', { length: 100 }),
  width:      int('width', { unsigned: true }),
  height:     int('height', { unsigned: true }),
  sizeBytes:  int('size_bytes', { unsigned: true }),
  alt:        text('alt'),
  articleId:  int('article_id', { unsigned: true }),
  uploadedAt: datetime('uploaded_at').default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  articleIdx: index('idx_article').on(t.articleId),
}))
