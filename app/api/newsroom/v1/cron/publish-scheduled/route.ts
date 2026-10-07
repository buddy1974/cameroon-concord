import { randomUUID } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { getNewsroomConfig } from '@/lib/newsroom/config'
import { errorResponse, jsonError, jsonOk } from '@/lib/newsroom/http'
import { safeEqual } from '@/lib/auth/safe-compare'
import { buildDeps, getStore } from '@/lib/newsroom/handler'
import { publishDue } from '@/lib/newsroom/articles'
import { writeAudit } from '@/lib/newsroom/audit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CRON_ACTOR = 'system:cron'

/**
 * Vercel Cron backstop for scheduled publishing (daily). Vercel sends
 * `Authorization: Bearer <CRON_SECRET>`; without CRON_SECRET the route is closed.
 */
export async function GET(req: NextRequest) {
  const requestId = randomUUID()
  const cfg = getNewsroomConfig()
  if (!cfg.enabled) return jsonError('API_DISABLED', 'Newsroom API is disabled', requestId)
  if (!cfg.cronSecret) return jsonError('API_NOT_CONFIGURED', 'Cron is not configured', requestId)

  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!safeEqual(token, cfg.cronSecret)) return jsonError('SIGNATURE_INVALID', 'Unauthorized', requestId)
  if (!cfg.writesEnabled) return jsonError('WRITES_DISABLED', 'Newsroom writes are disabled', requestId)

  try {
    const store = await getStore()
    const deps = await buildDeps(store)
    const result = await publishDue(deps, { requestId, actor: CRON_ACTOR, idempotencyKey: null })
    await writeAudit(store, {
      requestId, actor: CRON_ACTOR, operation: 'scheduler.cron', articleId: null,
      changedFields: result.published.length ? ['status', 'publishedAt'] : [], idempotencyKey: null,
      result: 'ok', errorCode: null,
    })
    return jsonOk(result, requestId)
  } catch (err) {
    console.error('[newsroom] cron publish-scheduled failed:', err instanceof Error ? err.name : 'error')
    return errorResponse(err, requestId)
  }
}
