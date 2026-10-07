/**
 * Cache invalidation for newsroom publish/unpublish/edits — the same set the
 * admin article routes use. Only caches: no social, IndexNow, push or scrapes.
 * Errors are swallowed (e.g. when called outside a Next request context).
 */
import { revalidatePath, revalidateTag } from 'next/cache'

export function revalidatePublicArticle(categorySlug: string | null, articleSlug: string): void {
  const paths = ['/', '/sitemap.xml', '/news-sitemap.xml', '/rss.xml']
  if (categorySlug) paths.push(`/${categorySlug}`, `/${categorySlug}/${articleSlug}`)
  try { revalidateTag('articles', {}) } catch { /* outside request scope */ }
  for (const p of paths) {
    try { revalidatePath(p) } catch { /* outside request scope */ }
  }
}
