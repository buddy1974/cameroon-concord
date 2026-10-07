import { newsroomRoute } from '@/lib/newsroom/handler'
import { createDraft, listArticles } from '@/lib/newsroom/articles'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const GET = newsroomRoute({ operation: 'articles.list', write: false, minRole: 'viewer' }, async ({ deps, url }) => ({
  data: await listArticles(deps.store, url.searchParams),
}))

/** Always creates a draft. Never publishes, never posts to social. */
export const POST = newsroomRoute({ operation: 'article.create', write: true, minRole: 'contributor' }, async (ctx) => {
  const r = await createDraft(ctx.deps, ctx.actor, ctx.body())
  return { data: r.article, status: 201, articleId: r.articleId, changedFields: r.changedFields }
})
