import { newsroomRoute } from '@/lib/newsroom/handler'
import { presignMedia } from '@/lib/newsroom/media'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const POST = newsroomRoute({ operation: 'media.presign', write: true, minRole: 'contributor' }, async (ctx) => ({
  data: await presignMedia(ctx.deps, ctx.actor, ctx.body()),
}))
