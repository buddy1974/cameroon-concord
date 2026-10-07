import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { FakeStorage, installHarness, json, params, resetNewsroomEnv, signedRequest, type Harness } from './helpers'
import { MemoryStore } from './store-memory'
import type { Actor } from '@/lib/newsroom/permissions'
import type { MediaDeps } from '@/lib/newsroom/media'

const actor = (role: Actor['role'], id: string): Actor => ({ id: `telegram:${id}`, kind: 'telegram', telegramUserId: id, role })
const contributor = actor('contributor', '3')
const editor = actor('editor', '2')
const viewer = actor('viewer', '4')

let store: MemoryStore
let storage: FakeStorage
let deps: MediaDeps
beforeEach(() => {
  store = new MemoryStore()
  storage = new FakeStorage()
  deps = { store, storage, now: () => new Date('2026-10-07T12:00:00Z'), onPublicChange: () => {} }
})

const png = (w = 2400, h = 1200) =>
  sharp({ create: { width: w, height: h, channels: 3, background: '#c8102e' } }).png().toBuffer()

async function expectError(p: Promise<unknown>, code: string, field?: string) {
  await assert.rejects(p, (err: { code?: string; fields?: Record<string, string> }) => {
    assert.equal(err.code, code)
    if (field) assert.ok(err.fields && field in err.fields, `expected field ${field}, got ${JSON.stringify(err.fields)}`)
    return true
  })
}

describe('uploadMedia', () => {
  test('image → WebP ≤ 1200 px under newsroom/<uuid>.webp, recorded in media', async () => {
    const { uploadMedia } = await import('@/lib/newsroom/media')
    const r = await uploadMedia(deps, contributor, {
      filename: 'photo.png', contentType: 'image/png', dataBase64: (await png()).toString('base64'), alt: 'Flag',
    })
    assert.equal(r.data.contentType, 'image/webp')
    assert.equal(r.data.width, 1200)
    assert.equal(r.data.height, 600)
    const [key] = [...storage.objects.keys()]
    assert.match(key, /^newsroom\/[0-9a-f-]{36}\.webp$/)
    assert.equal(r.data.url, `https://cdn.example.test/${key}`)
    assert.equal(store.media.length, 1)
    assert.equal(store.media[0].alt, 'Flag')
    assert.equal(store.media[0].articleId, null)
  })

  test('decoded size > 4 MB → 422, nothing stored', async () => {
    const { uploadMedia, MAX_DIRECT_UPLOAD_BYTES } = await import('@/lib/newsroom/media')
    const big = Buffer.alloc(MAX_DIRECT_UPLOAD_BYTES + 1, 0x25)
    big.write('%PDF-', 0)
    await expectError(uploadMedia(deps, contributor, {
      filename: 'big.pdf', contentType: 'application/pdf', dataBase64: big.toString('base64'),
    }), 'VALIDATION', 'dataBase64')
    assert.equal(storage.puts, 0)
  })

  test('disallowed content types → 422', async () => {
    const { uploadMedia } = await import('@/lib/newsroom/media')
    for (const contentType of ['image/svg+xml', 'text/html', 'application/x-msdownload', '']) {
      await expectError(uploadMedia(deps, contributor, {
        filename: 'x', contentType, dataBase64: Buffer.from('hello').toString('base64'),
      }), 'VALIDATION', 'contentType')
    }
    assert.equal(storage.puts, 0)
  })

  test('declared type must match the bytes', async () => {
    const { uploadMedia } = await import('@/lib/newsroom/media')
    await expectError(uploadMedia(deps, contributor, {
      filename: 'fake.pdf', contentType: 'application/pdf', dataBase64: Buffer.from('<html>').toString('base64'),
    }), 'VALIDATION', 'dataBase64')
    await expectError(uploadMedia(deps, contributor, {
      filename: 'fake.png', contentType: 'image/png', dataBase64: Buffer.from('not an image').toString('base64'),
    }), 'VALIDATION', 'dataBase64')
    await expectError(uploadMedia(deps, contributor, {
      filename: 'x.pdf', contentType: 'application/pdf', dataBase64: '!!!not base64!!!',
    }), 'VALIDATION', 'dataBase64')
  })

  test('non-image allowed types are stored as-is', async () => {
    const { uploadMedia } = await import('@/lib/newsroom/media')
    const pdf = Buffer.from('%PDF-1.7\n%test\n')
    const r = await uploadMedia(deps, contributor, { filename: 'doc.pdf', contentType: 'application/pdf', dataBase64: pdf.toString('base64') })
    assert.equal(r.data.contentType, 'application/pdf')
    assert.equal(r.data.sizeBytes, pdf.length)
    const [[key, obj]] = [...storage.objects.entries()]
    assert.match(key, /\.pdf$/)
    assert.deepEqual(obj.body, pdf)
  })

  test('featured: version-checked, sets featured_image / image_alt', async () => {
    const { uploadMedia } = await import('@/lib/newsroom/media')
    const { toArticle } = await import('@/lib/newsroom/articles')
    const id = store.seedArticle({ origin: '3' })
    const version = toArticle((await store.getArticle(id))!).version
    const data = (await png(400, 300)).toString('base64')
    await expectError(uploadMedia(deps, contributor, {
      filename: 'f.png', contentType: 'image/png', dataBase64: data, articleId: id, role: 'featured',
    }), 'VALIDATION', 'expectedVersion')
    await expectError(uploadMedia(deps, contributor, {
      filename: 'f.png', contentType: 'image/png', dataBase64: data, articleId: id, role: 'featured', expectedVersion: 'stale',
    }), 'VERSION_CONFLICT')
    assert.equal(storage.puts, 0)
    const r = await uploadMedia(deps, contributor, {
      filename: 'f.png', contentType: 'image/png', dataBase64: data, articleId: id, role: 'featured',
      expectedVersion: version, alt: 'Alt text', caption: 'Caption',
    })
    assert.equal(r.data.article?.featuredImage, r.data.url)
    assert.equal(r.data.article?.imageAlt, 'Alt text')
    assert.equal(r.data.article?.imageCaption, 'Caption')
    assert.notEqual(r.data.article?.version, version)
    assert.equal(store.media[0].articleId, id)
  })

  test('permissions: contributor own draft/unattached only; editor any; viewer none', async () => {
    const { uploadMedia } = await import('@/lib/newsroom/media')
    const others = store.seedArticle({ origin: '77' })
    const pdf = Buffer.from('%PDF-1.4').toString('base64')
    const body = (articleId?: number) => ({ filename: 'd.pdf', contentType: 'application/pdf', dataBase64: pdf, articleId })
    await expectError(uploadMedia(deps, contributor, body(others)), 'FORBIDDEN')
    await expectError(uploadMedia(deps, viewer, body()), 'FORBIDDEN')
    assert.ok((await uploadMedia(deps, editor, body(others))).data.mediaId)
    assert.ok((await uploadMedia(deps, contributor, body())).data.mediaId)
  })

  test('no storage configured → 503 API_NOT_CONFIGURED', async () => {
    const { uploadMedia } = await import('@/lib/newsroom/media')
    await expectError(uploadMedia({ ...deps, storage: null }, contributor, {
      filename: 'd.pdf', contentType: 'application/pdf', dataBase64: Buffer.from('%PDF-1.4').toString('base64'),
    }), 'API_NOT_CONFIGURED')
  })
})

describe('presign + confirm', () => {
  test('presign returns a 15-minute PUT for an allowed type; size limits enforced', async () => {
    const { presignMedia, MAX_PRESIGNED_UPLOAD_BYTES } = await import('@/lib/newsroom/media')
    const p = await presignMedia(deps, contributor, { filename: 'clip.mp4', contentType: 'video/mp4', sizeBytes: 20_000_000 })
    assert.match(p.key, /^newsroom\/[0-9a-f-]{36}\.mp4$/)
    assert.equal(p.expiresAt, '2026-10-07T12:15:00.000Z')
    assert.deepEqual(p.headers, { 'Content-Type': 'video/mp4' })
    await expectError(presignMedia(deps, contributor, { filename: 'x', contentType: 'video/mp4', sizeBytes: MAX_PRESIGNED_UPLOAD_BYTES + 1 }), 'VALIDATION', 'sizeBytes')
    await expectError(presignMedia(deps, contributor, { filename: 'x', contentType: 'text/html', sizeBytes: 10 }), 'VALIDATION', 'contentType')
  })

  test('confirm verifies the object exists (HeadObject) and records it once', async () => {
    const { presignMedia, confirmMedia } = await import('@/lib/newsroom/media')
    const p = await presignMedia(deps, contributor, { filename: 'clip.mp4', contentType: 'video/mp4', sizeBytes: 1000 })
    await expectError(confirmMedia(deps, contributor, { key: p.key }), 'NOT_FOUND')
    storage.objects.set(p.key, { body: Buffer.alloc(1000), contentType: 'video/mp4' })
    const r = await confirmMedia(deps, contributor, { key: p.key })
    assert.equal(r.data.sizeBytes, 1000)
    assert.equal(r.data.contentType, 'video/mp4')
    await expectError(confirmMedia(deps, contributor, { key: p.key }), 'INVALID_STATE')
    await expectError(confirmMedia(deps, contributor, { key: 'uploads/other.webp' }), 'VALIDATION', 'key')
  })
})

describe('media route', () => {
  let h: Harness
  beforeEach(async () => { resetNewsroomEnv(); h = await installHarness() })
  afterEach(async () => { (await import('@/lib/newsroom/handler')).setNewsroomOverrides(null) })

  test('POST /media signed upload → 201 with media result; audited', async () => {
    const { POST } = await import('@/app/api/newsroom/v1/media/route')
    const res = await POST(signedRequest('/api/newsroom/v1/media', {
      method: 'POST', body: { filename: 'p.png', contentType: 'image/png', dataBase64: (await png(100, 50)).toString('base64') },
    }), params())
    assert.equal(res.status, 201)
    const body = await json(res)
    assert.equal(body.data.contentType, 'image/webp')
    assert.equal(h.storage.puts, 1)
    assert.equal(h.store.audit.at(-1)?.operation, 'media.upload')
    assert.equal(h.store.audit.at(-1)?.result, 'ok')
  })
})
