import { db } from '@/lib/db/client'
import { categories } from '@/lib/db/schema'
import { eq, isNull, asc } from 'drizzle-orm'
import type { Category } from '@/lib/types'

export async function getAllCategories(): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name))
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const normalized = slug.toLowerCase().trim()
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, normalized))
    .limit(1)
  if (rows[0]) return rows[0]

  // Fallback: fetch all and fuzzy-match (handles slug encoding differences)
  const all = await db.select().from(categories)
  const match = all.find(c =>
    c.slug.toLowerCase() === normalized ||
    c.slug.toLowerCase().replace(/[^a-z0-9]/g, '-') === normalized
  )
  return match ?? null
}

export async function getTopLevelCategories(): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .where(isNull(categories.parentId))
    .orderBy(asc(categories.sortOrder), asc(categories.name))
}
