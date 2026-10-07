/**
 * Idempotency (contract §8). A key is reserved before the write runs, so two
 * concurrent retries cannot both execute; only successful responses are kept
 * for replay, failures release the key so the client may retry.
 */
import { createHash } from 'node:crypto'
import { NewsroomError } from './http'
import type { NewsroomStore } from './store'

/** A pending reservation older than this is treated as abandoned (crashed invocation). */
export const STALE_PENDING_MS = 120_000

export function requestHash(method: string, path: string, body: string): string {
  return createHash('sha256').update(method.toUpperCase() + path + body).digest('hex')
}

export type IdempotencyStart =
  | { kind: 'new' }
  | { kind: 'replay'; status: number; data: unknown }

export async function beginIdempotent(
  store: NewsroomStore,
  args: { key: string; actor: string; method: string; path: string; body: string; now: Date },
): Promise<IdempotencyStart> {
  const hash = requestHash(args.method, args.path, args.body)
  const record = {
    key: args.key, actor: args.actor, method: args.method.toUpperCase(), path: args.path.slice(0, 255),
    requestHash: hash, statusCode: 0, responseJson: null, createdAt: args.now,
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    const existing = await store.reserveIdempotency(record)
    if (!existing) return { kind: 'new' }

    if (existing.requestHash !== hash) {
      throw new NewsroomError('IDEMPOTENCY_MISMATCH', 'Idempotency key was already used for a different request')
    }
    if (existing.statusCode === 0) {
      const age = args.now.getTime() - existing.createdAt.getTime()
      if (age > STALE_PENDING_MS && attempt === 0) {
        await store.releaseIdempotency(args.key, args.actor)
        continue
      }
      throw new NewsroomError('IDEMPOTENCY_MISMATCH', 'A request with this idempotency key is still in progress')
    }
    let data: unknown = null
    try { data = existing.responseJson ? JSON.parse(existing.responseJson) : null } catch { data = null }
    // A replayed create answers 200 rather than 201 (contract §6).
    return { kind: 'replay', status: existing.statusCode === 201 ? 200 : existing.statusCode, data }
  }
  throw new NewsroomError('IDEMPOTENCY_MISMATCH', 'A request with this idempotency key is still in progress')
}

export async function completeIdempotent(
  store: NewsroomStore, key: string, actor: string, status: number, data: unknown,
): Promise<void> {
  await store.completeIdempotency(key, actor, status, JSON.stringify(data ?? null))
}

export async function abandonIdempotent(store: NewsroomStore, key: string, actor: string): Promise<void> {
  try { await store.releaseIdempotency(key, actor) } catch { /* reservation will go stale */ }
}
