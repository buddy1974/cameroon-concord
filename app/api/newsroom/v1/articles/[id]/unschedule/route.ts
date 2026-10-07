import { newsroomRoute } from '@/lib/newsroom/handler'
import { parseArticleId, unscheduleArticle } from '@/lib/newsroom/articles'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const POST = newsroomRoute({ operation: 'article.unschedule', write: true, minRole: 'publisher' }, async (ctx) => {
  const id = parseArticleId(ctx.params.id ?? '')
  ctx.setArticleId(id)
  const r = await unscheduleArticle(ctx.deps, ctx.actor, id, ctx.body())
  return { data: r.article, articleId: r.articleId, changedFields: r.changedFields }
})
