/**
 * Regression (2026-10-07 live): signed search GETs with spaces failed with "Invalid request signature"
 * because the Preview routing re-encoded %20 as '+' before the raw query was hashed.
 * The canonical string now uses a normalized query (contract §2, vector 2).
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { canonicalPathWithQuery, computeSignature, verifySignedRequest } from '@/lib/newsroom/verify'
import { MemoryStore } from './store-memory'
import { TEST_SECRET, uniqueNonce } from './helpers'

const SIGNED = '/api/newsroom/v1/articles?q=tm%20dual-publication%20live%20test&limit=5'

function req(urlPath: string, signedPath: string, overrides: Record<string, string> = {}) {
  const ts = Math.floor(Date.now() / 1000)
  const nonce = uniqueNonce()
  const rid = '11111111-2222-4333-8444-555555555555'
  const sig = computeSignature(TEST_SECRET, { method: 'GET', pathWithQuery: signedPath, body: '', timestamp: ts, nonce, actor: 'telegram:999000999', requestId: rid, idempotencyKey: null })
  const headers = new Headers({ 'x-newsroom-timestamp': String(ts), 'x-newsroom-nonce': nonce, 'x-newsroom-request-id': rid, 'x-newsroom-actor': 'telegram:999000999', 'x-newsroom-signature': sig, ...overrides })
  return { method: 'GET', url: `https://concord.preview.test${urlPath}`, headers }
}

describe('query canonicalization (search with spaces)', () => {
  test('contract vector 2', () => {
    const base = { method: 'GET', body: '', timestamp: 1791331200, nonce: '00112233445566778899aabbccddeeff', actor: 'telegram:123456789', requestId: '11111111-2222-4333-8444-555555555555', idempotencyKey: null }
    for (const v of [SIGNED, SIGNED.replace(/%20/g, '+'), '/api/newsroom/v1/articles?limit=5&q=tm%20dual-publication%20live%20test']) {
      assert.equal(computeSignature('test-vector-secret-do-not-use', { ...base, pathWithQuery: v }), 'v1=304863fd654f40277b7c1860bb6e52a0341ac2fe7e34951ab6ef8e1c52d3eaaf')
    }
    assert.notEqual(canonicalPathWithQuery('/x?q=a%2Bb'), canonicalPathWithQuery('/x?q=a+b'))
  })

  test('signed over %20, received as + (proxy re-encoding) → verified', async () => {
    const r = await verifySignedRequest(req(SIGNED.replace(/%20/g, '+'), SIGNED), '', new MemoryStore(), { secret: TEST_SECRET })
    assert.equal(r.ok, true)
  })

  test('received exactly as signed → verified', async () => {
    const r = await verifySignedRequest(req(SIGNED, SIGNED), '', new MemoryStore(), { secret: TEST_SECRET })
    assert.equal(r.ok, true)
  })

  test('tampered search value → rejected', async () => {
    const r = await verifySignedRequest(req('/api/newsroom/v1/articles?q=other+story&limit=5', SIGNED), '', new MemoryStore(), { secret: TEST_SECRET })
    assert.equal(r.ok, false)
  })

  test('extra parameter injected → rejected', async () => {
    const r = await verifySignedRequest(req(`${SIGNED}&status=published`, SIGNED), '', new MemoryStore(), { secret: TEST_SECRET })
    assert.equal(r.ok, false)
  })
})
