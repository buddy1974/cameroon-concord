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
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug.toLowerCase().trim()))
    .limit(1)
  return rows[0] ?? null
}

export async function getTopLevelCategories(): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .where(isNull(categories.parentId))
    .orderBy(asc(categories.sortOrder), asc(categories.name))
}
