import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { adminToken, makeRequest, TEST_AUTOMATION_KEY, TEST_JWT_SECRET } from './env'

describe('admin session tokens', () => {
  test('valid token verifies', async () => {
    const { verifyToken } = await import('@/lib/auth')
    assert.ok(await verifyToken(await adminToken()))
  })

  test('garbage / forged tokens are rejected', async () => {
    const { verifyToken } = await import('@/lib/auth')
    assert.equal(await verifyToken('not-a-jwt'), null)
    assert.equal(await verifyToken(''), null)
    assert.equal(await verifyToken(await adminToken('some-other-secret-value-xyz')), null)
  })

  test('missing JWT_SECRET fails closed (no fallback literal)', async () => {
    const { verifyToken, signToken } = await import('@/lib/auth')
    const token = await adminToken()
    const saved = process.env.JWT_SECRET
    try {
      delete process.env.JWT_SECRET
      assert.equal(await verifyToken(token), null)
      await assert.rejects(signToken({ sub: 'a', email: 'a', role: 'admin' }))
      // the previously hard-coded fallback secret must not be accepted either
      process.env.JWT_SECRET = 'fallback-dev-secret-change-in-production'
      assert.equal(await verifyToken(await adminToken('fallback-dev-secret-change-in-production')), null)
    } finally {
      process.env.JWT_SECRET = saved ?? TEST_JWT_SECRET
    }
  })
})

describe('requireAdmin', () => {
  test('no cookie → 401', async () => {
    const { requireAdmin } = await import('@/lib/auth/require-admin')
    const r = await requireAdmin(makeRequest('/api/admin/x'))
    assert.equal(r.ok, false)
    if (!r.ok) assert.equal(r.response.status, 401)
  })

  test('invalid cookie → 401 (Promise is awaited, never truthy-checked)', async () => {
    const { requireAdmin } = await import('@/lib/auth/require-admin')
    const r = await requireAdmin(makeRequest('/api/admin/x', { cookie: 'anything-non-empty' }))
    assert.equal(r.ok, false)
  })

  test('valid cookie → ok', async () => {
    const { requireAdmin } = await import('@/lib/auth/require-admin')
    const r = await requireAdmin(makeRequest('/api/admin/x', { cookie: await adminToken() }))
    assert.equal(r.ok, true)
  })
})

describe('machine key', () => {
  test('safeEqual', async () => {
    const { safeEqual } = await import('@/lib/auth/safe-compare')
    assert.equal(safeEqual('abc', 'abc'), true)
    assert.equal(safeEqual('abc', 'abd'), false)
    assert.equal(safeEqual('abc', 'abcd'), false)
    assert.equal(safeEqual('', ''), false)
    assert.equal(safeEqual(null, 'abc'), false)
    assert.equal(safeEqual(undefined, undefined), false)
  })

  test('valid / invalid / unconfigured', async () => {
    const { checkAutomationKey } = await import('@/lib/auth/require-automation')
    assert.equal(checkAutomationKey(TEST_AUTOMATION_KEY), 'ok')
    assert.equal(checkAutomationKey('wrong-key'), 'invalid')
    assert.equal(checkAutomationKey(null), 'invalid')
    const saved = process.env.AUTOMATION_API_KEY
    try {
      delete process.env.AUTOMATION_API_KEY
      assert.equal(checkAutomationKey(TEST_AUTOMATION_KEY), 'unconfigured')
    } finally {
      process.env.AUTOMATION_API_KEY = saved
    }
  })

  test('NEXT_PUBLIC_AUTOMATION_API_KEY never authenticates', async () => {
    const { checkAutomationKey } = await import('@/lib/auth/require-automation')
    process.env.NEXT_PUBLIC_AUTOMATION_API_KEY = 'public-bundle-key'
    try {
      assert.equal(checkAutomationKey('public-bundle-key'), 'invalid')
    } finally {
      delete process.env.NEXT_PUBLIC_AUTOMATION_API_KEY
    }
  })

  test('requireAdminOrAutomation: a wrong key does not fall through to a valid cookie', async () => {
    const { requireAdminOrAutomation } = await import('@/lib/auth/require-automation')
    const bad = await requireAdminOrAutomation(
      makeRequest('/x', { apiKey: 'wrong', cookie: await adminToken() }))
    assert.equal(bad.ok, false)
    const machine = await requireAdminOrAutomation(makeRequest('/x', { apiKey: TEST_AUTOMATION_KEY }))
    assert.deepEqual(machine, { ok: true, actor: 'automation' })
    const human = await requireAdminOrAutomation(makeRequest('/x', { cookie: await adminToken() }))
    assert.deepEqual(human, { ok: true, actor: 'admin' })
  })
})
