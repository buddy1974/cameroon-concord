import { mysqlTable, char, varchar, int, datetime } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const countryVisits = mysqlTable('country_visits', {
  countryCode: char('country_code', { length: 2 }).notNull().primaryKey(),
  countryName: varchar('country_name', { length: 100 }).notNull(),
  visitCount:  int('visit_count', { unsigned: true }).default(1),
  lastSeen:    datetime('last_seen').default(sql`CURRENT_TIMESTAMP`),
})
