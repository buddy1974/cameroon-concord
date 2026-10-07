import { newsroomRoute } from '@/lib/newsroom/handler'
import { confirmMedia } from '@/lib/newsroom/media'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const POST = newsroomRoute({ operation: 'media.confirm', write: true, minRole: 'contributor' }, async (ctx) => {
  const r = await confirmMedia(ctx.deps, ctx.actor, ctx.body())
  return { data: r.data, status: 201, articleId: r.articleId, changedFields: r.changedFields }
})
