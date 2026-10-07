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
