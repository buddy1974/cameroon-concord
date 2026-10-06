import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Constant-time string comparison. Both inputs are hashed first so that
 * neither the content nor the length of the expected secret leaks via timing.
 */
export function safeEqual(provided: string | null | undefined, expected: string | null | undefined): boolean {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false
  if (provided.length === 0 || expected.length === 0) return false
  const a = createHash('sha256').update(provided).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}
