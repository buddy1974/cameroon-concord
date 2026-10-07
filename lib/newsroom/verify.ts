/**
 * Newsroom API v1 request verification (contract §2).
 * Mirrors the TM reference signer byte-for-byte; any change is a protocol change.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import type { ErrorCode } from './http'

export const SIGNATURE_VERSION = 'v1'
export const TIMESTAMP_TOLERANCE_SECONDS = 300
/** Nonces are remembered well beyond the timestamp window (contract: ≥ 10 min). */
export const NONCE_TTL_SECONDS = 15 * 60
export const MAX_IDEMPOTENCY_KEY_LENGTH = 200

export const HEADERS = {
  timestamp: 'x-newsroom-timestamp',
  nonce: 'x-newsroom-nonce',
  requestId: 'x-newsroom-request-id',
  actor: 'x-newsroom-actor',
  idempotencyKey: 'x-newsroom-idempotency-key',
  signature: 'x-newsroom-signature',
} as const

export const SCHEDULER_ACTOR = 'system:scheduler'

const TIMESTAMP_RE = /^\d{1,12}$/
const NONCE_RE = /^[0-9a-f]{32}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ACTOR_RE = /^(telegram:\d{1,20}|system:scheduler)$/
const SIGNATURE_RE = /^v1=[0-9a-f]{64}$/
// Printable ASCII, no whitespace — keeps keys safe to store and log.
const IDEMPOTENCY_KEY_RE = /^[\x21-\x7e]{1,200}$/

export interface SignatureInput {
  method: string
  pathWithQuery: string
  body: string | Uint8Array
  timestamp: number
  nonce: string
  actor: string
  requestId: string
  idempotencyKey?: string | null
}

export function sha256Hex(data: string | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex')
}

export function canonicalString(input: SignatureInput): string {
  return [
    SIGNATURE_VERSION,
    input.method.toUpperCase(),
    input.pathWithQuery,
    sha256Hex(input.body),
    String(input.timestamp),
    input.nonce,
    input.actor,
    input.requestId,
    input.idempotencyKey ?? '',
  ].join('\n')
}

export function computeSignature(secret: string, input: SignatureInput): string {
  return `${SIGNATURE_VERSION}=` + createHmac('sha256', secret).update(canonicalString(input)).digest('hex')
}

/** Constant-time compare; hashing first hides length differences. */
export function signaturesEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb) && a.length === b.length
}

/** `pathname + "?" + raw query`, or just the pathname when there is no query. */
export function pathWithQueryOf(url: string): string {
  const u = new URL(url)
  return u.search && u.search !== '?' ? `${u.pathname}${u.search}` : u.pathname
}

export interface SignedHeaders {
  timestamp: number
  nonce: string
  requestId: string
  actor: string
  idempotencyKey: string | null
  signature: string
}

export type ParseResult = { ok: true; value: SignedHeaders } | { ok: false }

export function isWriteMethod(method: string): boolean {
  const m = method.toUpperCase()
  return m === 'POST' || m === 'PATCH' || m === 'PUT' || m === 'DELETE'
}

/** Step 2: every required header present and well-formed. */
export function parseSignedHeaders(headers: Headers, method: string): ParseResult {
  const timestamp = headers.get(HEADERS.timestamp) ?? ''
  const nonce = headers.get(HEADERS.nonce) ?? ''
  const requestId = headers.get(HEADERS.requestId) ?? ''
  const actor = headers.get(HEADERS.actor) ?? ''
  const signature = headers.get(HEADERS.signature) ?? ''
  const idem = headers.get(HEADERS.idempotencyKey)

  if (!TIMESTAMP_RE.test(timestamp) || !NONCE_RE.test(nonce) || !UUID_RE.test(requestId)) return { ok: false }
  if (!ACTOR_RE.test(actor) || !SIGNATURE_RE.test(signature)) return { ok: false }
  if (idem !== null && idem !== '' && !IDEMPOTENCY_KEY_RE.test(idem)) return { ok: false }
  const idempotencyKey = idem ? idem : null
  if (isWriteMethod(method) && !idempotencyKey) return { ok: false }

  return { ok: true, value: { timestamp: Number(timestamp), nonce, requestId, actor, idempotencyKey, signature } }
}

/** Request id to echo: the caller's when well-formed, otherwise null. */
export function requestIdFromHeaders(headers: Headers): string | null {
  const id = headers.get(HEADERS.requestId)
  return id && UUID_RE.test(id) ? id : null
}

export interface NonceStore {
  /** Atomically records the nonce. Returns false when it was already seen. */
  consumeNonce(nonce: string, expiresAt: Date): Promise<boolean>
}

export type VerifyResult =
  | { ok: true; headers: SignedHeaders; pathWithQuery: string }
  | { ok: false; code: Extract<ErrorCode, 'SIGNATURE_INVALID' | 'TIMESTAMP_EXPIRED' | 'NONCE_REPLAY'> }

/**
 * Steps 2–5 of the verification order. The nonce is consumed only after the
 * signature is proven, so unauthenticated traffic never reaches the store.
 */
export async function verifySignedRequest(
  req: { method: string; url: string; headers: Headers },
  rawBody: string,
  store: NonceStore,
  opts: { secret: string; nowMs?: number },
): Promise<VerifyResult> {
  const parsed = parseSignedHeaders(req.headers, req.method)
  if (!parsed.ok) return { ok: false, code: 'SIGNATURE_INVALID' }
  const h = parsed.value

  const nowMs = opts.nowMs ?? Date.now()
  if (Math.abs(Math.floor(nowMs / 1000) - h.timestamp) > TIMESTAMP_TOLERANCE_SECONDS) {
    return { ok: false, code: 'TIMESTAMP_EXPIRED' }
  }

  const pathWithQuery = pathWithQueryOf(req.url)
  const expected = computeSignature(opts.secret, {
    method: req.method,
    pathWithQuery,
    body: rawBody,
    timestamp: h.timestamp,
    nonce: h.nonce,
    actor: h.actor,
    requestId: h.requestId,
    idempotencyKey: h.idempotencyKey,
  })
  if (!signaturesEqual(expected, h.signature)) return { ok: false, code: 'SIGNATURE_INVALID' }

  const fresh = await store.consumeNonce(h.nonce, new Date(nowMs + NONCE_TTL_SECONDS * 1000))
  if (!fresh) return { ok: false, code: 'NONCE_REPLAY' }

  return { ok: true, headers: h, pathWithQuery }
}
