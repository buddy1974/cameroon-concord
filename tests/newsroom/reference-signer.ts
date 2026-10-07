// Verbatim copy of the TM reference signer (newsroom-control-plane/lib/signing.ts).
// Tests sign with it so the publication verifier is proven against TM's exact implementation.
/**
 * Newsroom API v1 request signing (TM → publication).
 *
 * The canonical string is the exact contract shared with each publication's
 * `/api/newsroom/v1` verifier. Any change here is a protocol change and must be
 * mirrored in both publication repositories (see docs/newsroom-api-v1.md).
 */
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'

export const SIGNATURE_VERSION = 'v1'
export const TIMESTAMP_TOLERANCE_SECONDS = 300

export const HEADERS = {
  timestamp: 'x-newsroom-timestamp',
  nonce: 'x-newsroom-nonce',
  requestId: 'x-newsroom-request-id',
  actor: 'x-newsroom-actor',
  idempotencyKey: 'x-newsroom-idempotency-key',
  signature: 'x-newsroom-signature',
} as const

export interface SignatureInput {
  method: string
  /** pathname plus raw query string exactly as sent, e.g. `/api/newsroom/v1/articles?q=biya` */
  pathWithQuery: string
  /** raw request body bytes ('' for no body) */
  body: string | Uint8Array
  timestamp: number
  nonce: string
  /** `telegram:<numeric id>` */
  actor: string
  requestId: string
  idempotencyKey?: string | null
}

export function sha256Hex(data: string | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex')
}

/** RFC 3986 strict percent-encoding (encodeURIComponent leaves !'()* unescaped). */
function strictEncode(s: string): string {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}

function formDecode(s: string): string {
  try { return decodeURIComponent(s.replace(/\+/g, ' ')) } catch { return s }
}

/**
 * Canonical path + query (contract §2). The query is parsed as application/x-www-form-urlencoded
 * ('+' and '%20' are both a space), pairs are sorted by name then value, and re-encoded with
 * strict RFC 3986 encoding. Proxies that re-encode equivalent query bytes (e.g. %20 → '+')
 * therefore cannot break verification, while every name and value stays signed.
 */
export function canonicalPathWithQuery(pathWithQuery: string): string {
  const i = pathWithQuery.indexOf('?')
  if (i === -1) return pathWithQuery
  const path = pathWithQuery.slice(0, i)
  const pairs = pathWithQuery.slice(i + 1).split('&').filter(Boolean).map((part) => {
    const eq = part.indexOf('=')
    return eq === -1 ? [formDecode(part), ''] : [formDecode(part.slice(0, eq)), formDecode(part.slice(eq + 1))]
  })
  pairs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0))
  return pairs.length ? `${path}?${pairs.map(([k, v]) => `${strictEncode(k)}=${strictEncode(v)}`).join('&')}` : path
}

export function canonicalString(input: SignatureInput): string {
  return [
    SIGNATURE_VERSION,
    input.method.toUpperCase(),
    canonicalPathWithQuery(input.pathWithQuery),
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

export function signaturesEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb) && a.length === b.length
}

export function newNonce(): string {
  return randomBytes(16).toString('hex')
}

export function newRequestId(): string {
  return randomUUID()
}

/** Builds the full header set for a signed request. */
export function signedHeaders(
  secret: string,
  req: Omit<SignatureInput, 'timestamp' | 'nonce' | 'requestId'> & { timestamp?: number; nonce?: string; requestId?: string },
): Record<string, string> {
  const input: SignatureInput = {
    ...req,
    timestamp: req.timestamp ?? Math.floor(Date.now() / 1000),
    nonce: req.nonce ?? newNonce(),
    requestId: req.requestId ?? newRequestId(),
  }
  const headers: Record<string, string> = {
    [HEADERS.timestamp]: String(input.timestamp),
    [HEADERS.nonce]: input.nonce,
    [HEADERS.requestId]: input.requestId,
    [HEADERS.actor]: input.actor,
    [HEADERS.signature]: computeSignature(secret, input),
  }
  if (input.idempotencyKey) headers[HEADERS.idempotencyKey] = input.idempotencyKey
  return headers
}
