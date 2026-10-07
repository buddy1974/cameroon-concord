import { newsroomRoute } from '@/lib/newsroom/handler'
import { publishDue } from '@/lib/newsroom/articles'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Lets TM drive scheduled publishing. Actor `system:scheduler` or a publisher. */
export const POST = newsroomRoute(
  { operation: 'scheduler.run', write: true, minRole: 'publisher', allowScheduler: true },
  async (ctx) => {
    const r = await publishDue(ctx.deps, { requestId: ctx.requestId, actor: ctx.actor.id, idempotencyKey: ctx.idempotencyKey })
    return { data: r, changedFields: r.published.length ? ['status', 'publishedAt'] : [] }
  },
)
