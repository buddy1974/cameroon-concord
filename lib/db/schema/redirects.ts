import {
  mysqlTable, int, varchar, smallint, index,
} from 'drizzle-orm/mysql-core'

export const redirects = mysqlTable('redirects', {
  id:         int('id', { unsigned: true }).autoincrement().primaryKey(),
  fromPath:   varchar('from_path', { length: 512 }).notNull().unique(),
  toPath:     varchar('to_path', { length: 512 }).notNull(),
  statusCode: smallint('status_code').default(301),
}, (t) => ({
  fromIdx: index('idx_from').on(t.fromPath),
}))
