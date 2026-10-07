/**
 * Route wrapper for /api/newsroom/v1/* (contract §2–§3, §8, §10):
 *   enabled → raw body → signature/timestamp/nonce → actor grant + role
 *   → writes-enabled → idempotency (POST/PATCH) → handler → audit → envelope.
 *
 * The store is resolved lazily: a request that fails signature verification
 * never touches the database.
 */
import { randomUUID } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { getNewsroomConfig } from './config'
import { errorResponse, jsonError, jsonOk, NewsroomError } from './http'
import { verifySignedRequest, requestIdFromHeaders, type NonceStore } from './verify'
import { canRunScheduler, requireRole, resolveActor, type Actor } from './permissions'
import { abandonIdempotent, beginIdempotent, completeIdempotent } from './idempotency'
import { auditResultFor, writeAudit } from './audit'
import type { NewsroomStore, Role } from './store'
import type { MediaDeps, MediaStorage } from './media'
import { revalidatePublicArticle } from './revalidate'

/** Generous cap on the raw body we are willing to buffer (base64 of 4 MB ≈ 5.6 MB). */
export const MAX_RAW_BODY_BYTES = 6 * 1024 * 1024

// ── Dependency resolution (overridable in tests) ─────────────────────────────

export interface NewsroomOverrides {
  store?: NewsroomStore
  storage?: MediaStorage | null
  now?: () => Date
  onPublicChange?: (categorySlug: string | null, slug: string) => void
}

let overrides: NewsroomOverrides | null = null

/** Test hook: inject an in-memory store / fake storage / clock. Pass null to reset. */
export function setNewsroomOverrides(o: NewsroomOverrides | null): void {
  overrides = o
}

export async function getStore(): Promise<NewsroomStore> {
  if (overrides?.store) return overrides.store
  const mod = await import('./store-mysql')
  return mod.mysqlNewsroomStore
}

async function getStorage(): Promise<MediaStorage | null> {
  if (overrides && 'storage' in overrides) return overrides.storage ?? null
  const mod = await import('./media-r2')
  return mod.createR2Storage()
}

/** Whole seconds: matches DATETIME precision so versions are stable across re-reads. */
function defaultNow(): Date {
  return new Date(Math.floor(Date.now() / 1000) * 1000)
}

export async function buildDeps(store: NewsroomStore): Promise<MediaDeps> {
  const onPublicChange = overrides?.onPublicChange ?? revalidatePublicArticle
  return {
    store,
    now: overrides?.now ?? defaultNow,
    onPublicChange,
    storage: await getStorage(),
  }
}

// ── Route wrapper ────────────────────────────────────────────────────────────

export interface RouteOptions {
  /** Audit operation name, e.g. `article.create`. */
  operation: string
  write: boolean
  minRole: Role
  /** Allow the `system:scheduler` actor (scheduler/run only). */
  allowScheduler?: boolean
}

export interface RouteContext {
  req: NextRequest
  url: URL
  params: Record<string, string>
  actor: Actor
  requestId: string
  idempotencyKey: string | null
  deps: MediaDeps
  /** Parsed JSON body ({} when empty). Throws 400 BAD_REQUEST on invalid JSON. */
  body(): unknown
  /** Let the audit row name the article even when the handler fails. */
  setArticleId(id: number | null): void
}

export interface RouteResult {
  data: unknown
  status?: number
  articleId?: number | null
  changedFields?: string[] | null
}

type RouteParams = { params: Promise<Record<string, string>> }

export function newsroomRoute(opts: RouteOptions, fn: (ctx: RouteContext) => Promise<RouteResult>) {
  return async function handler(req: NextRequest, routeCtx?: RouteParams): Promise<Response> {
    const requestId = requestIdFromHeaders(req.headers) ?? randomUUID()
    const cfg = getNewsroomConfig()
    if (!cfg.enabled) return jsonError('API_DISABLED', 'Newsroom API is disabled', requestId)
    if (!cfg.secret) return jsonError('API_NOT_CONFIGURED', 'Newsroom API is not configured', requestId)

    const declared = Number(req.headers.get('content-length') ?? '0')
    if (Number.isFinite(declared) && declared > MAX_RAW_BODY_BYTES) {
      return jsonError('BAD_REQUEST', 'Request body too large', requestId)
    }
    let rawBody: string
    try {
      rawBody = await req.text()
    } catch {
      return jsonError('BAD_REQUEST', 'Unreadable request body', requestId)
    }
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_RAW_BODY_BYTES) {
      return jsonError('BAD_REQUEST', 'Request body too large', requestId)
    }

    // The store is only resolved once the signature has been proven.
    let store: NewsroomStore | null = null
    const lazyNonceStore: NonceStore = {
      async consumeNonce(nonce, expiresAt) {
        store = await getStore()
        return store.consumeNonce(nonce, expiresAt)
      },
    }
    const verified = await verifySignedRequest(req, rawBody, lazyNonceStore, { secret: cfg.secret }).catch(() => null)
    if (!verified) return jsonError('INTERNAL', 'Internal error', requestId)
    if (!verified.ok) {
      const msg = verified.code === 'TIMESTAMP_EXPIRED' ? 'Request timestamp outside the allowed window'
        : verified.code === 'NONCE_REPLAY' ? 'Nonce already used' : 'Invalid request signature'
      return jsonError(verified.code, msg, requestId)
    }
    const s: NewsroomStore = store ?? await getStore()
    const { actor: actorHeader, idempotencyKey } = verified.headers

    let auditArticleId: number | null = null
    const audit = (status: number, errorCode: string | null, actorId: string, extra?: Partial<RouteResult>) =>
      opts.write
        ? writeAudit(s, {
            requestId, actor: actorId, operation: opts.operation,
            articleId: extra?.articleId ?? auditArticleId, changedFields: extra?.changedFields ?? null,
            idempotencyKey, result: auditResultFor(status), errorCode,
          })
        : Promise.resolve()

    // Actor → active grant → role.
    let actor: Actor
    try {
      actor = await resolveActor(actorHeader, s, { ownerTelegramIds: cfg.ownerTelegramIds, allowScheduler: !!opts.allowScheduler })
      if (opts.allowScheduler) {
        if (!canRunScheduler(actor)) throw new NewsroomError('FORBIDDEN', 'Insufficient role for this operation')
      } else {
        requireRole(actor, opts.minRole)
      }
    } catch (err) {
      const res = errorResponse(err, requestId)
      if (err instanceof NewsroomError) await audit(res.status, err.code, actorHeader)
      return res
    }

    if (opts.write && !cfg.writesEnabled) {
      return jsonError('WRITES_DISABLED', 'Newsroom writes are disabled', requestId)
    }

    const deps = await buildDeps(s)
    const method = req.method.toUpperCase()
    const useIdempotency = (method === 'POST' || method === 'PATCH') && !!idempotencyKey
    let reserved = false

    try {
      if (useIdempotency) {
        const start = await beginIdempotent(s, {
          key: idempotencyKey!, actor: actor.id, method, path: verified.pathWithQuery, body: rawBody, now: new Date(),
        })
        if (start.kind === 'replay') return jsonOk(start.data, requestId, start.status)
        reserved = true
      }

      const params = routeCtx?.params ? await routeCtx.params : {}
      let parsed: unknown
      let parsedDone = false
      const ctx: RouteContext = {
        req, url: new URL(req.url), params, actor, requestId, idempotencyKey, deps,
        body() {
          if (!parsedDone) {
            parsedDone = true
            if (!rawBody.trim()) parsed = {}
            else {
              try { parsed = JSON.parse(rawBody) } catch {
                throw new NewsroomError('BAD_REQUEST', 'Request body is not valid JSON')
              }
            }
          }
          return parsed
        },
        setArticleId(id) { auditArticleId = id },
      }

      const result = await fn(ctx)
      const status = result.status ?? 200
      if (reserved) await completeIdempotent(s, idempotencyKey!, actor.id, status, result.data)
      await audit(status, null, actor.id, result)
      return jsonOk(result.data, requestId, status)
    } catch (err) {
      if (reserved) await abandonIdempotent(s, idempotencyKey!, actor.id)
      if (!(err instanceof NewsroomError)) {
        console.error(`[newsroom] ${opts.operation} failed:`, err instanceof Error ? err.name : 'error',
          (err as { code?: unknown })?.code ?? '')
      }
      const res = errorResponse(err, requestId)
      await audit(res.status, err instanceof NewsroomError ? err.code : 'INTERNAL', actor.id)
      return res
    }
  }
}
