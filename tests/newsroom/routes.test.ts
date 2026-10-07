import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import {
  installHarness, json, OWNER_ID, params, resetNewsroomEnv, signedRequest, TEST_CRON_SECRET, TEST_SECRET, uniqueNonce,
  type Harness,
} from './helpers'
import { tripwireStore } from './store-memory'

const BASE = '/api/newsroom/v1'
const routes = {
  health: () => import('@/app/api/newsroom/v1/health/route'),
  me: () => import('@/app/api/newsroom/v1/me/route'),
  categories: () => import('@/app/api/newsroom/v1/categories/route'),
  authors: () => import('@/app/api/newsroom/v1/authors/route'),
  articles: () => import('@/app/api/newsroom/v1/articles/route'),
  article: () => import('@/app/api/newsroom/v1/articles/[id]/route'),
  publish: () => import('@/app/api/newsroom/v1/articles/[id]/publish/route'),
  unpublish: () => import('@/app/api/newsroom/v1/articles/[id]/unpublish/route'),
  schedule: () => import('@/app/api/newsroom/v1/articles/[id]/schedule/route'),
  unschedule: () => import('@/app/api/newsroom/v1/articles/[id]/unschedule/route'),
  media: () => import('@/app/api/newsroom/v1/media/route'),
  scheduler: () => import('@/app/api/newsroom/v1/scheduler/run/route'),
  cron: () => import('@/app/api/newsroom/v1/cron/publish-scheduled/route'),
}

let h: Harness
beforeEach(async () => { resetNewsroomEnv(); h = await installHarness() })
afterEach(async () => { (await import('@/lib/newsroom/handler')).setNewsroomOverrides(null); resetNewsroomEnv() })

const CONTRIB = '3003'
const EDITOR = '2002'
const VIEWER = '4004'
const PUBLISHER = '1001'
function grantAll() {
  h.store.grant(CONTRIB, 'contributor').grant(EDITOR, 'editor').grant(VIEWER, 'viewer').grant(PUBLISHER, 'publisher')
}

async function createVia(actorId: string, body: unknown = { title: 'Route draft', body: '<p>b</p>', categoryId: 1 }, idem?: string) {
  const { POST } = await routes.articles()
  return POST(signedRequest(`${BASE}/articles`, { method: 'POST', actor: `telegram:${actorId}`, body, idempotencyKey: idem }), params())
}

describe('health', () => {
  test('unsigned GET works and reveals no secrets', async () => {
    const { GET } = await routes.health()
    const res = await GET()
    assert.equal(res.status, 200)
    const body = await json(res)
    assert.deepEqual(body.data, { status: 'ok', enabled: true, writesEnabled: true, configured: true, publication: 'cameroon-concord' })
    assert.ok(!JSON.stringify(body).includes('test-only'))
  })

  test('reports disabled / unconfigured', async () => {
    delete process.env.NEWSROOM_API_ENABLED
    delete process.env.NEWSROOM_SIGNING_SECRET
    const body = await json(await (await routes.health()).GET())
    assert.equal(body.data.enabled, false)
    assert.equal(body.data.configured, false)
  })
})

describe('gatekeeping happens before any database access', () => {
  test('unsigned request → 401 and the store is never touched', async () => {
    const trip = tripwireStore()
    ;(await import('@/lib/newsroom/handler')).setNewsroomOverrides({ store: trip.store, storage: null })
    const { GET, POST } = await routes.articles()
    const unsigned = new NextRequest(new URL(`${BASE}/articles`, 'https://www.example.test'))
    const res = await GET(unsigned, params())
    assert.equal(res.status, 401)
    assert.equal((await json(res)).error?.code, 'SIGNATURE_INVALID')
    const res2 = await POST(new NextRequest(new URL(`${BASE}/articles`, 'https://www.example.test'), { method: 'POST', body: '{}' }), params())
    assert.equal(res2.status, 401)
    assert.deepEqual(trip.touched, [])
  })

  test('bad signature / expired timestamp → 401 and the store is never touched', async () => {
    const trip = tripwireStore()
    ;(await import('@/lib/newsroom/handler')).setNewsroomOverrides({ store: trip.store, storage: null })
    const { GET } = await routes.me()
    const bad = await GET(signedRequest(`${BASE}/me`, { secret: 'not-the-real-secret-123' }), params())
    assert.equal(bad.status, 401)
    const old = await GET(signedRequest(`${BASE}/me`, { timestamp: Math.floor(Date.now() / 1000) - 3600 }), params())
    assert.equal(old.status, 401)
    assert.equal((await json(old)).error?.code, 'TIMESTAMP_EXPIRED')
    assert.deepEqual(trip.touched, [])
  })

  test('error responses echo the request id and never leak internals', async () => {
    const { GET } = await routes.me()
    const req = signedRequest(`${BASE}/me`, { secret: 'not-the-real-secret-123' })
    const body = await json(await GET(req, params()))
    assert.equal(body.requestId, req.headers.get('x-newsroom-request-id'))
    assert.deepEqual(Object.keys(body.error!).sort(), ['code', 'message'])
  })

  test('replayed nonce → 401 NONCE_REPLAY', async () => {
    const { GET } = await routes.me()
    const nonce = uniqueNonce()
    assert.equal((await GET(signedRequest(`${BASE}/me`, { nonce }), params())).status, 200)
    const again = await GET(signedRequest(`${BASE}/me`, { nonce }), params())
    assert.equal(again.status, 401)
    assert.equal((await json(again)).error?.code, 'NONCE_REPLAY')
  })
})

describe('configuration switches', () => {
  test('API disabled → 503 API_DISABLED on every signed endpoint', async () => {
    process.env.NEWSROOM_API_ENABLED = 'false'
    const res = await (await routes.me()).GET(signedRequest(`${BASE}/me`), params())
    assert.equal(res.status, 503)
    assert.equal((await json(res)).error?.code, 'API_DISABLED')
    const cron = await (await routes.cron()).GET(new NextRequest('https://x.test/c', { headers: { authorization: `Bearer ${TEST_CRON_SECRET}` } }))
    assert.equal(cron.status, 503)
  })

  test('secret missing → 503 API_NOT_CONFIGURED', async () => {
    delete process.env.NEWSROOM_SIGNING_SECRET
    const res = await (await routes.me()).GET(signedRequest(`${BASE}/me`), params())
    assert.equal(res.status, 503)
    assert.equal((await json(res)).error?.code, 'API_NOT_CONFIGURED')
  })

  test('secret equal to AUTOMATION_API_KEY is refused', async () => {
    process.env.NEWSROOM_SIGNING_SECRET = process.env.AUTOMATION_API_KEY
    const res = await (await routes.me()).GET(signedRequest(`${BASE}/me`, { secret: process.env.AUTOMATION_API_KEY }), params())
    assert.equal((await json(res)).error?.code, 'API_NOT_CONFIGURED')
  })

  test('writes disabled → 503 WRITES_DISABLED for writes, reads still work', async () => {
    process.env.NEWSROOM_WRITES_ENABLED = 'false'
    const w = await createVia(OWNER_ID)
    assert.equal(w.status, 503)
    assert.equal((await json(w)).error?.code, 'WRITES_DISABLED')
    assert.equal(h.store.insertCount, 0)
    const r = await (await routes.categories()).GET(signedRequest(`${BASE}/categories`), params())
    assert.equal(r.status, 200)
  })
})

describe('actors and roles', () => {
  test('owner bootstrap id is a publisher', async () => {
    const body = await json(await (await routes.me()).GET(signedRequest(`${BASE}/me`), params()))
    assert.deepEqual(body.data, { actor: `telegram:${OWNER_ID}`, role: 'publisher', publication: 'cameroon-concord' })
  })

  test('unknown actor → 403 ACTOR_UNKNOWN', async () => {
    const res = await (await routes.me()).GET(signedRequest(`${BASE}/me`, { actor: 'telegram:5555' }), params())
    assert.equal(res.status, 403)
    assert.equal((await json(res)).error?.code, 'ACTOR_UNKNOWN')
  })

  test('inactive grant → 403 ACTOR_UNKNOWN', async () => {
    h.store.grant('6006', 'publisher', false)
    const res = await (await routes.me()).GET(signedRequest(`${BASE}/me`, { actor: 'telegram:6006' }), params())
    assert.equal((await json(res)).error?.code, 'ACTOR_UNKNOWN')
  })

  test('system:scheduler is rejected outside scheduler/run', async () => {
    const res = await (await routes.me()).GET(signedRequest(`${BASE}/me`, { actor: 'system:scheduler' }), params())
    assert.equal((await json(res)).error?.code, 'ACTOR_UNKNOWN')
  })

  test('viewer reads but cannot create (403, audited as denied)', async () => {
    grantAll()
    const list = await (await routes.articles()).GET(signedRequest(`${BASE}/articles?limit=5`, { actor: `telegram:${VIEWER}` }), params())
    assert.equal(list.status, 200)
    const res = await createVia(VIEWER)
    assert.equal(res.status, 403)
    assert.equal((await json(res)).error?.code, 'FORBIDDEN')
    assert.equal(h.store.audit.at(-1)?.result, 'denied')
    assert.equal(h.store.audit.at(-1)?.operation, 'article.create')
  })

  test('role matrix across endpoints', async () => {
    grantAll()
    const created = await json(await createVia(CONTRIB))
    const art = created.data
    // contributor: edit own draft ok, publish forbidden
    const { PATCH } = await routes.article()
    const p1 = await PATCH(signedRequest(`${BASE}/articles/${art.id}`, {
      method: 'PATCH', actor: `telegram:${CONTRIB}`, body: { expectedVersion: art.version, title: 'Mine' },
    }), params({ id: String(art.id) }))
    assert.equal(p1.status, 200)
    const v2 = (await json(p1)).data.version
    for (const [actorId, expected] of [[CONTRIB, 403], [EDITOR, 403], [VIEWER, 403]] as const) {
      const r = await (await routes.publish()).POST(signedRequest(`${BASE}/articles/${art.id}/publish`, {
        method: 'POST', actor: `telegram:${actorId}`, body: { expectedVersion: v2 },
      }), params({ id: String(art.id) }))
      assert.equal(r.status, expected, `publish as ${actorId}`)
    }
    // editor edits someone else's draft
    const p2 = await PATCH(signedRequest(`${BASE}/articles/${art.id}`, {
      method: 'PATCH', actor: `telegram:${EDITOR}`, body: { expectedVersion: v2, excerpt: 'by editor' },
    }), params({ id: String(art.id) }))
    assert.equal(p2.status, 200)
    const v3 = (await json(p2)).data.version
    // another contributor cannot edit it
    h.store.grant('3333', 'contributor')
    const p3 = await PATCH(signedRequest(`${BASE}/articles/${art.id}`, {
      method: 'PATCH', actor: 'telegram:3333', body: { expectedVersion: v3, title: 'Not mine' },
    }), params({ id: String(art.id) }))
    assert.equal(p3.status, 403)
    // publisher publishes, then unpublishes
    const pub = await (await routes.publish()).POST(signedRequest(`${BASE}/articles/${art.id}/publish`, {
      method: 'POST', actor: `telegram:${PUBLISHER}`, body: { expectedVersion: v3 },
    }), params({ id: String(art.id) }))
    assert.equal(pub.status, 200)
    const pubData = (await json(pub)).data
    assert.equal(pubData.status, 'published')
    assert.deepEqual(h.revalidated, ['politics/route-draft'])
    const un = await (await routes.unpublish()).POST(signedRequest(`${BASE}/articles/${art.id}/unpublish`, {
      method: 'POST', actor: `telegram:${PUBLISHER}`, body: { expectedVersion: pubData.version },
    }), params({ id: String(art.id) }))
    assert.equal((await json(un)).data.status, 'draft')
  })
})

describe('idempotency', () => {
  test('replay with the same key returns the same article and does not insert twice', async () => {
    const first = await createVia(OWNER_ID, undefined, 'tm:op:create-1')
    assert.equal(first.status, 201)
    const a = (await json(first)).data
    const again = await createVia(OWNER_ID, undefined, 'tm:op:create-1')
    assert.equal(again.status, 200)
    assert.deepEqual((await json(again)).data, a)
    assert.equal(h.store.insertCount, 1)
  })

  test('same key, different request → 409 IDEMPOTENCY_MISMATCH', async () => {
    await createVia(OWNER_ID, undefined, 'tm:op:create-2')
    const res = await createVia(OWNER_ID, { title: 'Different', body: '<p>b</p>', categoryId: 1 }, 'tm:op:create-2')
    assert.equal(res.status, 409)
    assert.equal((await json(res)).error?.code, 'IDEMPOTENCY_MISMATCH')
    assert.equal(h.store.insertCount, 1)
  })

  test('failed requests release the key so a corrected retry can run', async () => {
    const bad = await createVia(OWNER_ID, { title: 'No category', body: '<p>b</p>' }, 'tm:op:create-3')
    assert.equal(bad.status, 422)
    assert.equal(h.store.idempotency.size, 0)
  })
})

describe('audit', () => {
  test('ok writes are audited with field names only (no bodies)', async () => {
    const res = await createVia(OWNER_ID, { title: 'Audited', body: '<p>secret body text</p>', categoryId: 1 }, 'tm:op:audit-1')
    const id = (await json(res)).data.id
    const row = h.store.audit.find((e) => e.operation === 'article.create')!
    assert.equal(row.result, 'ok')
    assert.equal(row.articleId, id)
    assert.equal(row.actor, `telegram:${OWNER_ID}`)
    assert.equal(row.idempotencyKey, 'tm:op:audit-1')
    assert.ok(row.changedFields?.includes('body'))
    assert.ok(!JSON.stringify(h.store.audit).includes('secret body text'))
  })

  test('denied and failed writes are audited; reads are not', async () => {
    h.store.grant(VIEWER, 'viewer')
    await createVia(VIEWER)
    await createVia(OWNER_ID, { title: 'x' })
    await (await routes.me()).GET(signedRequest(`${BASE}/me`), params())
    assert.deepEqual(h.store.audit.map((e) => [e.result, e.errorCode]), [['denied', 'FORBIDDEN'], ['error', 'VALIDATION']])
  })
})

describe('reads', () => {
  test('categories, authors, article by id, list', async () => {
    const cats = await json(await (await routes.categories()).GET(signedRequest(`${BASE}/categories`), params()))
    assert.deepEqual(cats.data[0], { id: 1, slug: 'politics', name: 'Politics' })
    const authors = await json(await (await routes.authors()).GET(signedRequest(`${BASE}/authors`), params()))
    assert.deepEqual(authors.data, [{ id: 3, slug: 'desk', name: 'News Desk' }])
    const id = h.store.seedArticle({ title: 'Seeded' })
    const one = await json(await (await routes.article()).GET(signedRequest(`${BASE}/articles/${id}`), params({ id: String(id) })))
    assert.equal(one.data.title, 'Seeded')
    const missing = await (await routes.article()).GET(signedRequest(`${BASE}/articles/424242`), params({ id: '424242' }))
    assert.equal(missing.status, 404)
    const list = await json(await (await routes.articles()).GET(signedRequest(`${BASE}/articles?q=seed&limit=10`), params()))
    assert.equal(list.data.length, 1)
    assert.equal('body' in list.data[0], false)
  })

  test('invalid JSON body → 400 BAD_REQUEST', async () => {
    const { POST } = await routes.articles()
    // A correctly signed body that is not JSON.
    const { signedHeaders } = await import('./reference-signer')
    const body = '{not json'
    const headers = signedHeaders(TEST_SECRET, {
      method: 'POST', pathWithQuery: `${BASE}/articles`, body, actor: `telegram:${OWNER_ID}`, idempotencyKey: 'tm:bad-json', nonce: uniqueNonce(),
    })
    const res = await POST(new NextRequest(new URL(`${BASE}/articles`, 'https://www.example.test'), { method: 'POST', headers, body }), params())
    assert.equal(res.status, 400)
    assert.equal((await json(res)).error?.code, 'BAD_REQUEST')
  })
})

describe('scheduling endpoints', () => {
  async function scheduledArticle(minutesAhead: number) {
    const a = (await json(await createVia(OWNER_ID, { title: `Sched ${minutesAhead}`, body: '<p>b</p>', categoryId: 1 }))).data
    const res = await (await routes.schedule()).POST(signedRequest(`${BASE}/articles/${a.id}/schedule`, {
      method: 'POST', body: { expectedVersion: a.version, scheduledAt: new Date(Date.now() + minutesAhead * 60_000).toISOString() },
    }), params({ id: String(a.id) }))
    assert.equal(res.status, 200)
    return (await json(res)).data
  }

  test('scheduler/run accepts system:scheduler and publishes due items', async () => {
    const s = await scheduledArticle(5)
    h.clock.offsetMs = 10 * 60_000
    const res = await (await routes.scheduler()).POST(signedRequest(`${BASE}/scheduler/run`, {
      method: 'POST', actor: 'system:scheduler', body: {},
    }), params())
    assert.equal(res.status, 200)
    assert.deepEqual((await json(res)).data, { published: [s.id] })
    assert.equal((await h.store.getArticle(s.id))!.publishedAt?.toISOString(), s.scheduledAt)
  })

  test('scheduler/run forbids non-publishers', async () => {
    grantAll()
    const res = await (await routes.scheduler()).POST(signedRequest(`${BASE}/scheduler/run`, {
      method: 'POST', actor: `telegram:${EDITOR}`, body: {},
    }), params())
    assert.equal(res.status, 403)
  })

  test('unschedule via route', async () => {
    const s = await scheduledArticle(30)
    const res = await (await routes.unschedule()).POST(signedRequest(`${BASE}/articles/${s.id}/unschedule`, {
      method: 'POST', body: { expectedVersion: s.version },
    }), params({ id: String(s.id) }))
    assert.equal((await json(res)).data.status, 'draft')
  })

  test('cron requires Bearer CRON_SECRET (timing-safe) and 503 when unset', async () => {
    const { GET } = await routes.cron()
    const mk = (auth?: string) => new NextRequest('https://x.test/api/newsroom/v1/cron/publish-scheduled', {
      headers: auth ? { authorization: auth } : {},
    })
    assert.equal((await GET(mk())).status, 401)
    assert.equal((await GET(mk('Bearer wrong'))).status, 401)
    const s = await scheduledArticle(2)
    h.clock.offsetMs = 5 * 60_000
    const ok = await GET(mk(`Bearer ${TEST_CRON_SECRET}`))
    assert.equal(ok.status, 200)
    assert.deepEqual((await json(ok)).data, { published: [s.id] })
    delete process.env.CRON_SECRET
    assert.equal((await GET(mk(`Bearer ${TEST_CRON_SECRET}`))).status, 503)
  })
})
