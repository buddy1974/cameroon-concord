import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { signedRequest, TEST_SECRET, uniqueNonce } from './helpers'
import { MemoryStore } from './store-memory'
import * as reference from './reference-signer'

describe('signing — contract test vector', () => {
  const vector = {
    method: 'POST',
    pathWithQuery: '/api/newsroom/v1/articles',
    body: '{"title":"Test vector","body":"<p>Hello</p>","categoryId":9}',
    timestamp: 1791331200,
    nonce: '00112233445566778899aabbccddeeff',
    actor: 'telegram:123456789',
    requestId: '11111111-2222-4333-8444-555555555555',
    idempotencyKey: 'tm:op:test-vector:cc',
  }

  test('body hash and signature match the contract', async () => {
    const { sha256Hex, computeSignature } = await import('@/lib/newsroom/verify')
    assert.equal(sha256Hex(vector.body), 'c8a20806f9bebbbe13ef5a3402e47483aadf414b374c2cc988d01ab7a431b5a9')
    assert.equal(
      computeSignature('test-vector-secret-do-not-use', vector),
      'v1=8c6cd47ad941b58788e4d6f843c2e5873f2776101b6c7f36c789cf011704d227',
    )
  })

  test('canonical string is byte-identical to the TM reference signer', async () => {
    const { canonicalString } = await import('@/lib/newsroom/verify')
    assert.equal(canonicalString(vector), reference.canonicalString(vector))
    assert.equal(canonicalString({ ...vector, idempotencyKey: null }), reference.canonicalString({ ...vector, idempotencyKey: null }))
  })

  test('the vector verifies end-to-end at its own timestamp', async () => {
    const { verifySignedRequest } = await import('@/lib/newsroom/verify')
    const headers = new Headers(reference.signedHeaders('test-vector-secret-do-not-use', vector))
    const r = await verifySignedRequest(
      { method: 'POST', url: `https://cc.example${vector.pathWithQuery}`, headers },
      vector.body, new MemoryStore(), { secret: 'test-vector-secret-do-not-use', nowMs: vector.timestamp * 1000 },
    )
    assert.equal(r.ok, true)
  })
})

describe('verifySignedRequest', () => {
  async function verify(req: Request, store = new MemoryStore(), nowMs?: number) {
    const { verifySignedRequest } = await import('@/lib/newsroom/verify')
    const raw = await req.clone().text()
    return verifySignedRequest(req, raw, store, { secret: TEST_SECRET, nowMs })
  }

  test('valid signature (with query string) is accepted', async () => {
    const r = await verify(signedRequest('/api/newsroom/v1/articles?q=biya&status=draft,published&limit=5'))
    assert.equal(r.ok, true)
  })

  test('valid signed POST is accepted', async () => {
    const r = await verify(signedRequest('/api/newsroom/v1/articles', { method: 'POST', body: { title: 'x' } }))
    assert.equal(r.ok, true)
  })

  test('wrong secret → SIGNATURE_INVALID', async () => {
    const r = await verify(signedRequest('/api/newsroom/v1/me', { secret: 'some-other-secret-value' }))
    assert.deepEqual(r, { ok: false, code: 'SIGNATURE_INVALID' })
  })

  test('tampered body → SIGNATURE_INVALID', async () => {
    const r = await verify(signedRequest('/api/newsroom/v1/articles', {
      method: 'POST', body: { title: 'a' }, bodyOverride: JSON.stringify({ title: 'b' }),
    }))
    assert.deepEqual(r, { ok: false, code: 'SIGNATURE_INVALID' })
  })

  test('tampered query → SIGNATURE_INVALID', async () => {
    const good = signedRequest('/api/newsroom/v1/articles?limit=5')
    const forged = new Request('https://www.example.test/api/newsroom/v1/articles?limit=50', { headers: good.headers })
    assert.deepEqual(await verify(forged), { ok: false, code: 'SIGNATURE_INVALID' })
  })

  test('missing / malformed headers → SIGNATURE_INVALID', async () => {
    const good = signedRequest('/api/newsroom/v1/me')
    for (const [name, value] of [
      ['x-newsroom-signature', null], ['x-newsroom-nonce', 'XYZ'], ['x-newsroom-actor', 'telegram:abc'],
      ['x-newsroom-request-id', 'not-a-uuid'], ['x-newsroom-timestamp', '17e9'], ['x-newsroom-signature', 'v2=00'],
    ] as const) {
      const headers = new Headers(good.headers)
      if (value === null) headers.delete(name)
      else headers.set(name, value)
      const r = await verify(new Request(good.url, { headers }))
      assert.deepEqual(r, { ok: false, code: 'SIGNATURE_INVALID' }, `${name}=${value}`)
    }
  })

  test('POST without an idempotency key → SIGNATURE_INVALID', async () => {
    const { signedHeaders } = reference
    const body = '{}'
    const headers = signedHeaders(TEST_SECRET, { method: 'POST', pathWithQuery: '/api/newsroom/v1/articles', body, actor: 'telegram:1', nonce: uniqueNonce() })
    const r = await verify(new Request('https://www.example.test/api/newsroom/v1/articles', { method: 'POST', headers, body }))
    assert.deepEqual(r, { ok: false, code: 'SIGNATURE_INVALID' })
  })

  test('timestamp outside ±300 s → TIMESTAMP_EXPIRED (and the nonce is not consumed)', async () => {
    const store = new MemoryStore()
    const old = Math.floor(Date.now() / 1000) - 301
    assert.deepEqual(await verify(signedRequest('/api/newsroom/v1/me', { timestamp: old }), store), { ok: false, code: 'TIMESTAMP_EXPIRED' })
    const future = Math.floor(Date.now() / 1000) + 301
    assert.deepEqual(await verify(signedRequest('/api/newsroom/v1/me', { timestamp: future }), store), { ok: false, code: 'TIMESTAMP_EXPIRED' })
    assert.equal(store.nonces.size, 0)
    const edge = Math.floor(Date.now() / 1000) - 299
    assert.equal((await verify(signedRequest('/api/newsroom/v1/me', { timestamp: edge }), store)).ok, true)
  })

  test('nonce replay → NONCE_REPLAY', async () => {
    const store = new MemoryStore()
    const nonce = uniqueNonce()
    assert.equal((await verify(signedRequest('/api/newsroom/v1/me', { nonce }), store)).ok, true)
    assert.deepEqual(await verify(signedRequest('/api/newsroom/v1/me', { nonce }), store), { ok: false, code: 'NONCE_REPLAY' })
  })

  test('nonce is remembered for at least 10 minutes', async () => {
    const store = new MemoryStore()
    const nonce = uniqueNonce()
    await verify(signedRequest('/api/newsroom/v1/me', { nonce }), store)
    const expires = store.nonces.get(nonce)!
    assert.ok(expires.getTime() - Date.now() >= 10 * 60 * 1000 - 1000)
  })

  test('invalid signatures never reach the nonce store', async () => {
    const store = new MemoryStore()
    await verify(signedRequest('/api/newsroom/v1/me', { secret: 'wrong-secret-xxxxxxxx' }), store)
    assert.deepEqual(store.calls, [])
  })
})
