import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import './helpers'
import { MemoryStore } from './store-memory'
import type { Actor } from '@/lib/newsroom/permissions'
import type { ServiceDeps } from '@/lib/newsroom/articles'

const svc = () => import('@/lib/newsroom/articles')

const actor = (role: Actor['role'], id = '42'): Actor => ({ id: `telegram:${id}`, kind: 'telegram', telegramUserId: id, role })
const publisher = actor('publisher', '1')
const editor = actor('editor', '2')
const contributor = actor('contributor', '3')
const viewer = actor('viewer', '4')

let store: MemoryStore
let nowMs: number
let revalidated: string[]
let deps: ServiceDeps

beforeEach(() => {
  store = new MemoryStore()
  nowMs = Date.parse('2026-10-07T12:00:00Z')
  revalidated = []
  deps = { store, now: () => new Date(nowMs), onPublicChange: (c, s) => { revalidated.push(`${c}/${s}`) } }
})

async function expectError(p: Promise<unknown>, code: string, field?: string) {
  await assert.rejects(p, (err: { code?: string; fields?: Record<string, string> }) => {
    assert.equal(err.code, code)
    if (field) assert.ok(err.fields && field in err.fields, `expected field ${field}, got ${JSON.stringify(err.fields)}`)
    return true
  })
}

describe('createDraft', () => {
  test('always creates a draft, whatever the input says', async () => {
    const { createDraft } = await svc()
    const r = await createDraft(deps, contributor, {
      title: 'Hello Buea', body: '<p>Body</p>', categoryId: 1, status: 'published', publishedAt: '2020-01-01', slug: 'x',
    })
    assert.equal(r.article.status, 'draft')
    assert.equal(r.article.publishedAt, null)
    assert.equal(r.article.url, null)
    assert.equal(r.article.slug, 'hello-buea')
    assert.equal(r.article.createdViaNewsroom, true)
    assert.equal(store.origins.get(r.articleId), '3')
  })

  test('body is sanitised server-side', async () => {
    const { createDraft } = await svc()
    const r = await createDraft(deps, contributor, { title: 'T', body: '<p onclick="x()">Hi</p><script>alert(1)</script>', categoryId: 1 })
    assert.equal(r.article.body, '<p>Hi</p>')
  })

  test('category is required and must exist — no silent fallback', async () => {
    const { createDraft } = await svc()
    await expectError(createDraft(deps, contributor, { title: 'T', body: '<p>b</p>' }), 'VALIDATION', 'categoryId')
    await expectError(createDraft(deps, contributor, { title: 'T', body: '<p>b</p>', categoryId: 12345 }), 'VALIDATION', 'categoryId')
    await expectError(createDraft(deps, contributor, { title: 'T', body: '<p>b</p>', categorySlug: 'nope' }), 'VALIDATION', 'categorySlug')
    assert.equal(store.insertCount, 0)
    const bySlug = await createDraft(deps, contributor, { title: 'T', body: '<p>b</p>', categorySlug: 'headlines' })
    assert.equal(bySlug.article.categoryId, 9)
    assert.equal(bySlug.article.categorySlug, 'headlines')
  })

  test('title and body are required; author must exist', async () => {
    const { createDraft } = await svc()
    await expectError(createDraft(deps, contributor, { body: '<p>b</p>', categoryId: 1 }), 'VALIDATION', 'title')
    await expectError(createDraft(deps, contributor, { title: 'T', categoryId: 1 }), 'VALIDATION', 'body')
    await expectError(createDraft(deps, contributor, { title: 'x'.repeat(321), body: '<p>b</p>', categoryId: 1 }), 'VALIDATION', 'title')
    await expectError(createDraft(deps, contributor, { title: 'T', body: '<p>b</p>', categoryId: 1, authorId: 77 }), 'VALIDATION', 'authorId')
    const ok = await createDraft(deps, contributor, { title: 'T', body: '<p>b</p>', categoryId: 1, authorId: 3 })
    assert.equal(ok.article.authorName, 'News Desk')
  })

  test('slug collisions get -2, -3 …', async () => {
    const { createDraft } = await svc()
    store.seedArticle({ slug: 'biya-speech' })
    const a = await createDraft(deps, contributor, { title: 'Biya speech', body: '<p>b</p>', categoryId: 1 })
    const b = await createDraft(deps, contributor, { title: 'Biya Speech!', body: '<p>b</p>', categoryId: 1 })
    assert.equal(a.article.slug, 'biya-speech-2')
    assert.equal(b.article.slug, 'biya-speech-3')
  })

  test('aiAssisted → ai_generated=1, ai_reviewed=0', async () => {
    const { createDraft } = await svc()
    const r = await createDraft(deps, contributor, { title: 'AI', body: '<p>b</p>', categoryId: 1, aiAssisted: true })
    assert.equal(r.article.aiGenerated, true)
    assert.equal(store.aiReviewed.get(r.articleId), false)
    const h = await createDraft(deps, contributor, { title: 'Human', body: '<p>b</p>', categoryId: 1 })
    assert.equal(h.article.aiGenerated, false)
  })

  test('viewer cannot create', async () => {
    const { createDraft } = await svc()
    await expectError(createDraft(deps, viewer, { title: 'T', body: '<p>b</p>', categoryId: 1 }), 'FORBIDDEN')
  })
})

describe('mapping and version', () => {
  test('dates are ISO UTC; url only when published; version is 16 hex chars', async () => {
    const { toArticle, computeVersion } = await svc()
    const id = store.seedArticle({ status: 'published', slug: 'live', publishedAt: new Date('2026-05-01T08:30:00Z') })
    const rec = (await store.getArticle(id))!
    const a = toArticle(rec)
    assert.equal(a.publishedAt, '2026-05-01T08:30:00.000Z')
    assert.match(a.url ?? '', /^https?:\/\/[^/]+\/politics\/live$/)
    assert.match(a.version, /^[0-9a-f]{16}$/)
    assert.equal(a.version, computeVersion(rec))
    assert.equal(a.createdViaNewsroom, false)
  })

  test('version follows the contract formula exactly', async () => {
    const { computeVersion } = await svc()
    const { createHash } = await import('node:crypto')
    const id = store.seedArticle({ title: 'V', excerpt: 'e', authorId: 3, isBreaking: true, scheduledAt: new Date('2026-11-01T00:00:00Z') })
    const r = (await store.getArticle(id))!
    const iso = (d: Date | null) => (d ? d.toISOString() : null)
    const expected = createHash('sha256').update(JSON.stringify([
      r.status, r.title, r.subtitle, r.body, r.excerpt, r.categoryId, r.authorId, r.featuredImage, r.imageAlt,
      r.imageCaption, r.metaTitle, r.metaDesc, r.isBreaking, iso(r.publishedAt), iso(r.scheduledAt), iso(r.updatedAt),
    ])).digest('hex').slice(0, 16)
    assert.equal(computeVersion(r), expected)
  })
})

describe('updateArticle', () => {
  async function fresh(over: Parameters<MemoryStore['seedArticle']>[0] = {}) {
    const { toArticle } = await svc()
    const id = store.seedArticle(over)
    return { id, version: toArticle((await store.getArticle(id))!).version }
  }

  test('allowlisted fields are updated; slug/status/published_at untouched', async () => {
    const { updateArticle } = await svc()
    const { id, version } = await fresh()
    nowMs += 5000
    const r = await updateArticle(deps, editor, id, { expectedVersion: version, title: 'New title', isBreaking: true, categorySlug: 'headlines' })
    assert.equal(r.article.title, 'New title')
    assert.equal(r.article.slug, `seed-${id}`)
    assert.equal(r.article.status, 'draft')
    assert.equal(r.article.categoryId, 9)
    assert.deepEqual(r.changedFields.sort(), ['categorySlug', 'isBreaking', 'title'])
  })

  test('unknown and system fields → 422, nothing written', async () => {
    const { updateArticle } = await svc()
    const { id, version } = await fresh()
    for (const field of ['slug', 'status', 'publishedAt', 'id', 'aiGenerated', 'ccScore', 'fbPostedAt', 'bogus']) {
      await expectError(updateArticle(deps, editor, id, { expectedVersion: version, [field]: 'x' }), 'VALIDATION', field)
    }
    assert.equal(store.calls.filter((c) => c === 'updateArticle').length, 0)
  })

  test('expectedVersion is required; stale version → VERSION_CONFLICT', async () => {
    const { updateArticle } = await svc()
    const { id } = await fresh()
    await expectError(updateArticle(deps, editor, id, { title: 'x' }), 'VALIDATION', 'expectedVersion')
    await expectError(updateArticle(deps, editor, id, { expectedVersion: '0000000000000000', title: 'x' }), 'VERSION_CONFLICT')
  })

  test('a CMS change between read and write → VERSION_CONFLICT', async () => {
    const { updateArticle } = await svc()
    const { id, version } = await fresh()
    const a = store.articles.get(id)!
    store.articles.set(id, { ...a, title: 'Changed in CMS', updatedAt: new Date('2026-01-01T10:05:00Z') })
    await expectError(updateArticle(deps, editor, id, { expectedVersion: version, title: 'Mine' }), 'VERSION_CONFLICT')
  })

  test('unknown category on patch → 422 (no fallback)', async () => {
    const { updateArticle } = await svc()
    const { id, version } = await fresh()
    await expectError(updateArticle(deps, editor, id, { expectedVersion: version, categoryId: 4242 }), 'VALIDATION', 'categoryId')
  })

  test('contributor: own newsroom draft yes; someone else’s or CMS draft no; published no', async () => {
    const { updateArticle } = await svc()
    const own = await fresh({ origin: '3' })
    const other = await fresh({ origin: '77' })
    const cms = await fresh()
    const ownPublished = await fresh({ origin: '3', status: 'published', publishedAt: new Date('2026-01-01T00:00:00Z') })
    assert.equal((await updateArticle(deps, contributor, own.id, { expectedVersion: own.version, title: 'ok' })).article.title, 'ok')
    await expectError(updateArticle(deps, contributor, other.id, { expectedVersion: other.version, title: 'no' }), 'FORBIDDEN')
    await expectError(updateArticle(deps, contributor, cms.id, { expectedVersion: cms.version, title: 'no' }), 'FORBIDDEN')
    await expectError(updateArticle(deps, contributor, ownPublished.id, { expectedVersion: ownPublished.version, title: 'no' }), 'FORBIDDEN')
    await expectError(updateArticle(deps, viewer, own.id, { expectedVersion: own.version, title: 'no' }), 'FORBIDDEN')
  })

  test('editor may edit any article, including published (and caches are revalidated)', async () => {
    const { updateArticle } = await svc()
    const pub = await fresh({ status: 'published', slug: 'pub', publishedAt: new Date('2026-01-01T00:00:00Z') })
    const r = await updateArticle(deps, editor, pub.id, { expectedVersion: pub.version, excerpt: 'fixed' })
    assert.equal(r.article.excerpt, 'fixed')
    assert.equal(r.article.publishedAt, '2026-01-01T00:00:00.000Z')
    assert.deepEqual(revalidated, ['politics/pub'])
  })

  test('missing article → NOT_FOUND', async () => {
    const { updateArticle } = await svc()
    await expectError(updateArticle(deps, editor, 999999, { expectedVersion: 'x', title: 't' }), 'NOT_FOUND')
  })
})

describe('state transitions', () => {
  async function draft() {
    const { createDraft } = await svc()
    return (await createDraft(deps, contributor, { title: 'State', body: '<p>b</p>', categoryId: 1 })).article
  }

  test('publish sets published_at once; a later PATCH preserves it', async () => {
    const { publishArticle, updateArticle } = await svc()
    const d = await draft()
    nowMs += 60_000
    const p = await publishArticle(deps, publisher, d.id, { expectedVersion: d.version })
    assert.equal(p.article.status, 'published')
    assert.equal(p.article.publishedAt, new Date(nowMs).toISOString())
    assert.ok(p.article.url)
    assert.deepEqual(revalidated, ['politics/state'])
    const publishedAt = p.article.publishedAt
    nowMs += 3_600_000
    const u = await updateArticle(deps, editor, d.id, { expectedVersion: p.article.version, title: 'Edited' })
    assert.equal(u.article.publishedAt, publishedAt)
    assert.equal(u.article.status, 'published')
  })

  test('publishing an already published article → INVALID_STATE', async () => {
    const { publishArticle } = await svc()
    const d = await draft()
    const p = await publishArticle(deps, publisher, d.id, { expectedVersion: d.version })
    await expectError(publishArticle(deps, publisher, d.id, { expectedVersion: p.article.version }), 'INVALID_STATE')
  })

  test('only publishers may publish/unpublish/schedule/unschedule', async () => {
    const m = await svc()
    const d = await draft()
    for (const a of [editor, contributor, viewer]) {
      await expectError(m.publishArticle(deps, a, d.id, { expectedVersion: d.version }), 'FORBIDDEN')
      await expectError(m.unpublishArticle(deps, a, d.id, { expectedVersion: d.version }), 'FORBIDDEN')
      await expectError(m.scheduleArticle(deps, a, d.id, { expectedVersion: d.version, scheduledAt: '2030-01-01T00:00:00Z' }), 'FORBIDDEN')
      await expectError(m.unscheduleArticle(deps, a, d.id, { expectedVersion: d.version }), 'FORBIDDEN')
    }
  })

  test('unpublish → draft (CC), keeping published_at', async () => {
    const { publishArticle, unpublishArticle } = await svc()
    const d = await draft()
    const p = await publishArticle(deps, publisher, d.id, { expectedVersion: d.version })
    nowMs += 1000
    const u = await unpublishArticle(deps, publisher, d.id, { expectedVersion: p.article.version })
    assert.equal(u.article.status, 'draft')
    assert.equal(u.article.publishedAt, p.article.publishedAt)
    assert.equal(u.article.url, null)
    await expectError(unpublishArticle(deps, publisher, d.id, { expectedVersion: u.article.version }), 'INVALID_STATE')
  })

  test('schedule requires a time ≥ now + 60 s', async () => {
    const { scheduleArticle } = await svc()
    const d = await draft()
    await expectError(scheduleArticle(deps, publisher, d.id, { expectedVersion: d.version }), 'VALIDATION', 'scheduledAt')
    await expectError(scheduleArticle(deps, publisher, d.id, { expectedVersion: d.version, scheduledAt: 'tomorrow' }), 'VALIDATION', 'scheduledAt')
    await expectError(scheduleArticle(deps, publisher, d.id, {
      expectedVersion: d.version, scheduledAt: new Date(nowMs + 30_000).toISOString(),
    }), 'VALIDATION', 'scheduledAt')
    const at = new Date(nowMs + 3_600_000).toISOString()
    const s = await scheduleArticle(deps, publisher, d.id, { expectedVersion: d.version, scheduledAt: at })
    assert.equal(s.article.status, 'scheduled')
    assert.equal(s.article.scheduledAt, at)
    assert.equal(s.article.publishedAt, null)
  })

  test('unschedule → draft; invalid transitions → INVALID_STATE', async () => {
    const { scheduleArticle, unscheduleArticle } = await svc()
    const d = await draft()
    await expectError(unscheduleArticle(deps, publisher, d.id, { expectedVersion: d.version }), 'INVALID_STATE')
    const s = await scheduleArticle(deps, publisher, d.id, { expectedVersion: d.version, scheduledAt: new Date(nowMs + 600_000).toISOString() })
    await expectError(scheduleArticle(deps, publisher, d.id, {
      expectedVersion: s.article.version, scheduledAt: new Date(nowMs + 900_000).toISOString(),
    }), 'INVALID_STATE')
    const u = await unscheduleArticle(deps, publisher, d.id, { expectedVersion: s.article.version })
    assert.equal(u.article.status, 'draft')
    assert.equal(u.article.scheduledAt, null)
  })

  test('publishDue publishes due items with published_at = scheduled_at, not future ones', async () => {
    const { scheduleArticle, publishDue } = await svc()
    const a = await draft()
    const { createDraft } = await svc()
    const b = (await createDraft(deps, contributor, { title: 'Later', body: '<p>b</p>', categoryId: 1 })).article
    const dueAt = new Date(nowMs + 120_000).toISOString()
    await scheduleArticle(deps, publisher, a.id, { expectedVersion: a.version, scheduledAt: dueAt })
    await scheduleArticle(deps, publisher, b.id, { expectedVersion: b.version, scheduledAt: new Date(nowMs + 7_200_000).toISOString() })
    nowMs += 600_000
    const r = await publishDue(deps, { requestId: 'r1', actor: 'system:scheduler', idempotencyKey: null })
    assert.deepEqual(r.published, [a.id])
    const pa = (await store.getArticle(a.id))!
    assert.equal(pa.status, 'published')
    assert.equal(pa.publishedAt?.toISOString(), dueAt)
    assert.equal((await store.getArticle(b.id))!.status, 'scheduled')
    assert.ok(store.audit.some((e) => e.operation === 'article.publish_scheduled' && e.articleId === a.id))
    // a second run is a no-op
    assert.deepEqual((await publishDue(deps)).published, [])
  })
})

describe('listArticles', () => {
  test('filters, newest-updated first, limit ≤ 50', async () => {
    const { listArticles } = await svc()
    store.seedArticle({ title: 'Ambazonia crisis', status: 'published', updatedAt: new Date('2026-03-01T00:00:00Z') })
    store.seedArticle({ title: 'Biya returns', status: 'draft', updatedAt: new Date('2026-03-02T00:00:00Z') })
    store.seedArticle({ title: 'Biya again', status: 'published', categoryId: 9, updatedAt: new Date('2026-03-03T00:00:00Z') })
    const all = await listArticles(store, new URLSearchParams())
    assert.deepEqual(all.map((a) => a.title), ['Biya again', 'Biya returns', 'Ambazonia crisis'])
    assert.deepEqual((await listArticles(store, new URLSearchParams('q=biya&status=published'))).map((a) => a.title), ['Biya again'])
    assert.equal((await listArticles(store, new URLSearchParams('status=draft,published'))).length, 3)
    assert.deepEqual((await listArticles(store, new URLSearchParams('category=politics'))).length, 2)
    assert.equal((await listArticles(store, new URLSearchParams('limit=1'))).length, 1)
    await expectError(listArticles(store, new URLSearchParams('status=bogus')), 'VALIDATION', 'status')
  })
})
