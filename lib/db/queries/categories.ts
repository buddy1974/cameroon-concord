import { db } from '@/lib/db/client'
import { categories } from '@/lib/db/schema'
import { eq, isNull, asc } from 'drizzle-orm'
import type { Category } from '@/lib/types'

// ── In-memory category cache ─────────────────────────────────────────────────
// Categories change rarely. Cache the full table for 5 minutes to avoid
// hammering the DB with one lookup per page render.
const CACHE_TTL_MS = 5 * 60 * 1000

const _cache: {
  rows: Category[]
  expiresAt: number
} = { rows: [], expiresAt: 0 }

async function getCachedCategories(): Promise<Category[]> {
  if (Date.now() < _cache.expiresAt && _cache.rows.length > 0) {
    return _cache.rows
  }
  const rows = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name))
  _cache.rows = rows
  _cache.expiresAt = Date.now() + CACHE_TTL_MS
  return rows
}

/** Invalidate the cache immediately (call after creating/updating a category). */
export function invalidateCategoryCache(): void {
  _cache.expiresAt = 0
}

// ─────────────────────────────────────────────────────────────────────────────

export async function getAllCategories(): Promise<Category[]> {
  return getCachedCategories()
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const normalized = slug.toLowerCase().trim()
  const all = await getCachedCategories()

  // Exact match first
  const exact = all.find(c => c.slug === normalized)
  if (exact) return exact

  // Fuzzy match (handles slug encoding differences)
  const fuzzy = all.find(c =>
    c.slug.toLowerCase() === normalized ||
    c.slug.toLowerCase().replace(/[^a-z0-9]/g, '-') === normalized
  )
  return fuzzy ?? null
}

export async function getTopLevelCategories(): Promise<Category[]> {
  const all = await getCachedCategories()
  return all.filter(c => c.parentId == null)
}
