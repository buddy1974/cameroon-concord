import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { adminToken, idParams, makeRequest, TEST_AUTOMATION_KEY } from './env'

// Every request below must be rejected by auth before any database access.
const FORGED = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4ifQ.forged'

describe('article mutation routes reject unauthenticated callers', () => {
  for (const method of ['GET', 'PUT', 'DELETE'] as const) {
    test(`${method} /api/admin/articles/[id] without session → 401`, async () => {
      const route = await import('@/app/api/admin/articles/[id]/route')
      const res = await route[method](
        makeRequest('/api/admin/articles/1', { method, body: method === 'PUT' ? { status: 'published' } : undefined }),
        idParams())
      assert.equal(res.status, 401)
    })

    test(`${method} /api/admin/articles/[id] with forged token → 401`, async () => {
      const route = await import('@/app/api/admin/articles/[id]/route')
      const res = await route[method](
        makeRequest('/api/admin/articles/1', { method, cookie: FORGED, body: method === 'PUT' ? { title: 'x' } : undefined }),
        idParams())
      assert.equal(res.status, 401)
    })
  }

  test('POST /api/admin/articles with wrong machine key → 401', async () => {
    const route = await import('@/app/api/admin/articles/route')
    const res = await route.POST(makeRequest('/api/admin/articles', { method: 'POST', apiKey: 'wrong', body: {} }))
    assert.equal(res.status, 401)
  })
})

describe('previously unprotected admin writes now require a session', () => {
  const cases: Array<[string, string, 'POST' | 'PATCH' | 'DELETE', boolean]> = [
    ['/api/admin/accountability', '@/app/api/admin/accountability/route', 'POST', false],
    ['/api/admin/accountability/1', '@/app/api/admin/accountability/[id]/route', 'PATCH', true],
    ['/api/admin/accountability/1', '@/app/api/admin/accountability/[id]/route', 'DELETE', true],
    ['/api/admin/exile-voices/1', '@/app/api/admin/exile-voices/[id]/route', 'PATCH', true],
    ['/api/admin/exile-voices/1', '@/app/api/admin/exile-voices/[id]/route', 'DELETE', true],
    ['/api/admin/live-updates', '@/app/api/admin/live-updates/route', 'POST', false],
    ['/api/admin/live-updates/1', '@/app/api/admin/live-updates/[id]/route', 'DELETE', true],
  ]
  for (const [url, modPath, method, withId] of cases) {
    test(`${method} ${url} → 401`, async () => {
      const mod = await import(modPath) as Record<string, (...a: unknown[]) => Promise<Response>>
      const req = makeRequest(url, { method, body: { status: 'kept' } })
      const res = withId ? await mod[method](req, idParams()) : await mod[method](req)
      assert.equal(res.status, 401)
    })
  }
})

describe('non-awaited verifyToken bug class: any non-empty cookie used to pass', () => {
  const cases: Array<[string, string, 'GET' | 'POST' | 'PUT', boolean]> = [
    ['/api/admin/comments', '@/app/api/admin/comments/route', 'GET', false],
    ['/api/admin/comments/1', '@/app/api/admin/comments/[id]/route', 'PUT', true],
    ['/api/admin/comments/ban', '@/app/api/admin/comments/ban/route', 'POST', false],
    ['/api/admin/comments/reply', '@/app/api/admin/comments/reply/route', 'POST', false],
    ['/api/admin/newsletter/send', '@/app/api/admin/newsletter/send/route', 'POST', false],
    ['/api/admin/newsletter/subscribers', '@/app/api/admin/newsletter/subscribers/route', 'GET', false],
    ['/api/admin/newsletter/articles', '@/app/api/admin/newsletter/articles/route', 'GET', false],
  ]
  for (const [url, modPath, method, withId] of cases) {
    test(`${method} ${url} with junk cookie → 401`, async () => {
      const mod = await import(modPath) as Record<string, (...a: unknown[]) => Promise<Response>>
      const req = makeRequest(url, { method, cookie: 'junk', body: method === 'GET' ? undefined : {} })
      const res = withId ? await mod[method](req, idParams()) : await mod[method](req)
      assert.equal(res.status, 401)
    })
  }
})

describe('machine endpoints accept only the server-side key', () => {
  const machine: Array<[string, string]> = [
    ['/api/n8n/openai', '@/app/api/n8n/openai/route'],
    ['/api/n8n/social', '@/app/api/n8n/social/route'],
    ['/api/n8n/claude', '@/app/api/n8n/claude/route'],
    ['/api/push/send', '@/app/api/push/send/route'],
  ]
  for (const [url, modPath] of machine) {
    test(`POST ${url} invalid key → 401`, async () => {
      const mod = await import(modPath) as { POST: (r: unknown) => Promise<Response> }
      assert.equal((await mod.POST(makeRequest(url, { method: 'POST', apiKey: 'wrong', body: {} }))).status, 401)
    })
    test(`POST ${url} NEXT_PUBLIC key value → 401`, async () => {
      process.env.NEXT_PUBLIC_AUTOMATION_API_KEY = 'public-bundle-key'
      try {
        const mod = await import(modPath) as { POST: (r: unknown) => Promise<Response> }
        assert.equal((await mod.POST(makeRequest(url, { method: 'POST', apiKey: 'public-bundle-key', body: {} }))).status, 401)
      } finally {
        delete process.env.NEXT_PUBLIC_AUTOMATION_API_KEY
      }
    })
  }

  test('machine key cannot act as an admin session on cookie-only admin routes', async () => {
    const route = await import('@/app/api/admin/articles/[id]/route')
    const res = await route.DELETE(makeRequest('/api/admin/articles/1', { method: 'DELETE', apiKey: TEST_AUTOMATION_KEY }), idParams())
    assert.equal(res.status, 401)
  })
})

describe('login fails closed without configured secrets', () => {
  test('no ADMIN_PASSWORD → 503, never a fallback password', async () => {
    const saved = process.env.ADMIN_PASSWORD
    delete process.env.ADMIN_PASSWORD
    try {
      const { POST } = await import('@/app/api/admin/auth/login/route')
      const res = await POST(makeRequest('/api/admin/auth/login', { method: 'POST', body: { username: 'admin', password: 'admin' } }))
      assert.equal(res.status, 503)
    } finally {
      if (saved !== undefined) process.env.ADMIN_PASSWORD = saved
    }
  })

  test('wrong password → 401; right password → session cookie', async () => {
    process.env.ADMIN_USERNAME = 'editor'
    process.env.ADMIN_PASSWORD = 'correct-horse-battery'
    try {
      const { POST } = await import('@/app/api/admin/auth/login/route')
      const bad = await POST(makeRequest('/l', { method: 'POST', body: { username: 'editor', password: 'nope' } }))
      assert.equal(bad.status, 401)
      const good = await POST(makeRequest('/l', { method: 'POST', body: { username: 'editor', password: 'correct-horse-battery' } }))
      assert.equal(good.status, 200)
      assert.match(good.headers.get('set-cookie') ?? '', /admin_token=/)
    } finally {
      delete process.env.ADMIN_USERNAME
      delete process.env.ADMIN_PASSWORD
    }
  })

  test('no MAINTENANCE_PASSWORD → bypass impossible', async () => {
    delete process.env.MAINTENANCE_PASSWORD
    const { POST } = await import('@/app/api/maintenance-login/route')
    const res = await POST(makeRequest('/api/maintenance-login', { method: 'POST', body: { password: '' } }))
    assert.equal(res.status, 503)
  })
})

describe('valid admin session is still permitted where intended', () => {
  test('requireAdmin accepts the session the login route issues', async () => {
    const { requireAdmin } = await import('@/lib/auth/require-admin')
    const r = await requireAdmin(makeRequest('/api/admin/articles/1', { cookie: await adminToken() }))
    assert.equal(r.ok, true)
  })
})
