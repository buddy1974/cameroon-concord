/**
 * Response envelope helpers for the newsroom API (contract §3).
 * Error messages are fixed, human-readable strings — never stack traces, SQL or secrets.
 */
import { NextResponse } from 'next/server'

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'SIGNATURE_INVALID' | 'TIMESTAMP_EXPIRED' | 'NONCE_REPLAY'
  | 'ACTOR_UNKNOWN' | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VERSION_CONFLICT' | 'IDEMPOTENCY_MISMATCH' | 'INVALID_STATE'
  | 'VALIDATION'
  | 'API_DISABLED' | 'API_NOT_CONFIGURED' | 'WRITES_DISABLED'
  | 'INTERNAL'

export const ERROR_STATUS: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  SIGNATURE_INVALID: 401, TIMESTAMP_EXPIRED: 401, NONCE_REPLAY: 401,
  ACTOR_UNKNOWN: 403, FORBIDDEN: 403,
  NOT_FOUND: 404,
  VERSION_CONFLICT: 409, IDEMPOTENCY_MISMATCH: 409, INVALID_STATE: 409,
  VALIDATION: 422,
  API_DISABLED: 503, API_NOT_CONFIGURED: 503, WRITES_DISABLED: 503,
  INTERNAL: 500,
}

/** A deliberate, client-facing failure. Anything else thrown becomes INTERNAL. */
export class NewsroomError extends Error {
  readonly status: number
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message)
    this.name = 'NewsroomError'
    this.status = ERROR_STATUS[code]
  }
}

const NO_STORE = { 'cache-control': 'no-store' }

export function jsonOk(data: unknown, requestId: string, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data, requestId }, { status, headers: NO_STORE })
}

export function jsonError(
  code: ErrorCode,
  message: string,
  requestId: string,
  fields?: Record<string, string>,
): NextResponse {
  const error: { code: ErrorCode; message: string; fields?: Record<string, string> } = { code, message }
  if (fields && Object.keys(fields).length) error.fields = fields
  return NextResponse.json({ ok: false, error, requestId }, { status: ERROR_STATUS[code], headers: NO_STORE })
}

export function errorResponse(err: unknown, requestId: string): NextResponse {
  if (err instanceof NewsroomError) return jsonError(err.code, err.message, requestId, err.fields)
  return jsonError('INTERNAL', 'Internal error', requestId)
}
