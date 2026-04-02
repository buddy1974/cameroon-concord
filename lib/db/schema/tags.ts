import {
  mysqlTable, int, varchar, primaryKey, index,
} from 'drizzle-orm/mysql-core'

export const tags = mysqlTable('tags', {
  id:   int('id', { unsigned: true }).autoincrement().primaryKey(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  name: varchar('name', { length: 120 }).notNull(),
})

export const articleTags = mysqlTable('article_tags', {
  articleId: int('article_id', { unsigned: true }).notNull(),
  tagId:     int('tag_id', { unsigned: true }).notNull(),
}, (t) => ({
  pk:         primaryKey({ columns: [t.articleId, t.tagId] }),
  articleIdx: index('idx_article').on(t.articleId),
  tagIdx:     index('idx_tag').on(t.tagId),
}))
