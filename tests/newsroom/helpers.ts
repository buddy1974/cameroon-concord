/**
 * Newsroom test harness. Imports the Stage 0 forced dummy env first (DB points at
 * 127.0.0.1:1, never a real database), then forces newsroom settings. Every test
 * injects the in-memory store and a fake media storage — no DB, no R2.
 */
import '../security/env'
import { NextRequest } from 'next/server'
import { signedHeaders } from './reference-signer'
import { MemoryStore } from './store-memory'
import type { MediaStorage } from '@/lib/newsroom/media'

export const TEST_SECRET = 'test-only-newsroom-signing-secret-0123456789'
export const TEST_CRON_SECRET = 'test-only-cron-secret-0123456789'
export const OWNER_ID = '999000999'

export function resetNewsroomEnv(): void {
  process.env.NEWSROOM_API_ENABLED = 'true'
  process.env.NEWSROOM_SIGNING_SECRET = TEST_SECRET
  process.env.NEWSROOM_OWNER_TELEGRAM_IDS = OWNER_ID
  process.env.CRON_SECRET = TEST_CRON_SECRET
  delete process.env.NEWSROOM_WRITES_ENABLED
  for (const k of ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_URL']) delete process.env[k]
}
resetNewsroomEnv()

let nonceCounter = 0
export function uniqueNonce(): string {
  nonceCounter++
  return (Date.now().toString(16) + nonceCounter.toString(16).padStart(8, '0')).padStart(32, '0').slice(-32)
}

export interface SignedOpts {
  method?: 'GET' | 'POST' | 'PATCH'
  body?: unknown
  actor?: string
  idempotencyKey?: string
  timestamp?: number
  nonce?: string
  secret?: string
  /** Mutate the body after signing (tamper test). */
  bodyOverride?: string
}

export function signedRequest(pathWithQuery: string, o: SignedOpts = {}): NextRequest {
  const method = o.method ?? 'GET'
  const body = o.body === undefined ? '' : JSON.stringify(o.body)
  const idempotencyKey = o.idempotencyKey ?? (method === 'GET' ? undefined : `test:${uniqueNonce()}`)
  const headers = signedHeaders(o.secret ?? TEST_SECRET, {
    method, pathWithQuery, body, actor: o.actor ?? `telegram:${OWNER_ID}`, idempotencyKey,
    timestamp: o.timestamp, nonce: o.nonce ?? uniqueNonce(),
  })
  const sendBody = o.bodyOverride ?? body
  return new NextRequest(new URL(pathWithQuery, 'https://www.example.test'), {
    method,
    headers: { ...headers, ...(sendBody ? { 'content-type': 'application/json' } : {}) },
    body: sendBody ? sendBody : undefined,
  })
}

export const params = (p: Record<string, string> = {}) => ({ params: Promise.resolve(p) })

export async function json(res: Response): Promise<{ ok: boolean; data?: any; error?: { code: string; message: string; fields?: Record<string, string> }; requestId: string }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  return res.json()
}

export class FakeStorage implements MediaStorage {
  objects = new Map<string, { body: Buffer; contentType: string }>()
  puts = 0
  async put(key: string, body: Buffer, contentType: string) { this.puts++; this.objects.set(key, { body, contentType }) }
  async head(key: string) {
    const o = this.objects.get(key)
    return o ? { contentType: o.contentType, sizeBytes: o.body.length } : null
  }
  async presignPut(key: string) { return `https://r2.example.test/${key}?X-Amz-Signature=fake` }
  publicUrl(key: string) { return `https://cdn.example.test/${key}` }
}

export interface Harness {
  store: MemoryStore
  storage: FakeStorage
  revalidated: string[]
  clock: { offsetMs: number }
}

/** Installs the in-memory store, fake storage, controllable clock and revalidation spy. */
export async function installHarness(): Promise<Harness> {
  const { setNewsroomOverrides } = await import('@/lib/newsroom/handler')
  const h: Harness = { store: new MemoryStore(), storage: new FakeStorage(), revalidated: [], clock: { offsetMs: 0 } }
  setNewsroomOverrides({
    store: h.store,
    storage: h.storage,
    now: () => new Date(Math.floor((Date.now() + h.clock.offsetMs) / 1000) * 1000),
    onPublicChange: (c, s) => { h.revalidated.push(`${c}/${s}`) },
  })
  return h
}
