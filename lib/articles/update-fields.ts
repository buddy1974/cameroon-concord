import type { articles } from '@/lib/db/schema'
import { sanitizeArticleBody } from '@/lib/sanitize'

/**
 * Explicit allowlist of article fields the admin CMS may change via
 * PUT /api/admin/articles/[id]. Anything else in the request body is dropped,
 * so internal/system fields (id, publishedAt, createdAt, legacy*, ai*, ccScore,
 * fbPostedAt, twitterPostedAt, …) can no longer be set by including them in JSON.
 *
 * The list mirrors what the ArticleEditor and articles list actually send.
 */
export const ARTICLE_MUTABLE_FIELDS = [
  'title', 'slug', 'subtitle', 'body', 'excerpt',
  'categoryId', 'authorId',
  'featuredImage', 'imageAlt', 'imageCaption', 'canonicalUrl',
  'status', 'isBreaking', 'isFeatured', 'isLive', 'liveEnded',
  'metaTitle', 'metaDesc', 'summary', 'countryTags',
] as const

export const ARTICLE_STATUSES = ['draft', 'scheduled', 'published', 'archived'] as const

type ArticleInsert = typeof articles.$inferInsert
export type ArticleUpdate = Partial<Pick<ArticleInsert, typeof ARTICLE_MUTABLE_FIELDS[number]>>

export type PickResult =
  | { ok: true; update: ArticleUpdate; dropped: string[] }
  | { ok: false; error: string }

export function pickArticleUpdate(raw: unknown): PickResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Invalid body' }
  }
  const input = raw as Record<string, unknown>
  const allowed = new Set<string>(ARTICLE_MUTABLE_FIELDS)
  const update: Record<string, unknown> = {}
  const dropped: string[] = []

  for (const [key, value] of Object.entries(input)) {
    if (allowed.has(key)) update[key] = value
    else dropped.push(key)
  }

  if ('status' in update && !(ARTICLE_STATUSES as readonly unknown[]).includes(update.status)) {
    return { ok: false, error: 'Invalid status' }
  }
  if (typeof update.body === 'string') {
    update.body = sanitizeArticleBody(update.body)
  }

  return { ok: true, update: update as ArticleUpdate, dropped }
}
