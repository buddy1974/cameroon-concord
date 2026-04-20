import { mysqlTable, int, varchar, text, date, mysqlEnum, datetime } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const accountabilityPromises = mysqlTable('accountability_promises', {
  id:          int('id', { unsigned: true }).autoincrement().primaryKey(),
  official:    varchar('official', { length: 200 }).notNull(),
  ministry:    varchar('ministry', { length: 200 }),
  promise:     text('promise').notNull(),
  dateMade:    date('date_made').notNull(),
  deadline:    date('deadline'),
  status:      mysqlEnum('status', ['pending', 'kept', 'broken', 'partial']).default('pending'),
  evidenceUrl: varchar('evidence_url', { length: 500 }),
  notes:       text('notes'),
  createdAt:   datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt:   datetime('updated_at').default(sql`CURRENT_TIMESTAMP`),
})
