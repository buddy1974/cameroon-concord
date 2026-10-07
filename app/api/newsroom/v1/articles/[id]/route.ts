import { newsroomRoute } from '@/lib/newsroom/handler'
import { getArticleOr404, parseArticleId, toArticle, updateArticle } from '@/lib/newsroom/articles'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const GET = newsroomRoute({ operation: 'article.get', write: false, minRole: 'viewer' }, async ({ deps, params }) => ({
  data: toArticle(await getArticleOr404(deps.store, parseArticleId(params.id ?? ''))),
}))

export const PATCH = newsroomRoute({ operation: 'article.update', write: true, minRole: 'contributor' }, async (ctx) => {
  const id = parseArticleId(ctx.params.id ?? '')
  ctx.setArticleId(id)
  const r = await updateArticle(ctx.deps, ctx.actor, id, ctx.body())
  return { data: r.article, articleId: r.articleId, changedFields: r.changedFields }
})
