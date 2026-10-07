import { newsroomRoute } from '@/lib/newsroom/handler'
import { uploadMedia } from '@/lib/newsroom/media'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export const POST = newsroomRoute({ operation: 'media.upload', write: true, minRole: 'contributor' }, async (ctx) => {
  const r = await uploadMedia(ctx.deps, ctx.actor, ctx.body())
  return { data: r.data, status: 201, articleId: r.articleId, changedFields: r.changedFields }
})
