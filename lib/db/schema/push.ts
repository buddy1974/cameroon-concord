import { mysqlTable, int, varchar, datetime } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const pushSubscriptions = mysqlTable('push_subscriptions', {
  id:        int('id', { unsigned: true }).autoincrement().primaryKey(),
  endpoint:  varchar('endpoint', { length: 500 }).notNull().unique(),
  p256dh:    varchar('p256dh', { length: 255 }).notNull(),
  auth:      varchar('auth', { length: 255 }).notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
})
