import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import './env'

describe('article update allowlist', () => {
  test('non-allowlisted / system fields are dropped', async () => {
    const { pickArticleUpdate } = await import('@/lib/articles/update-fields')
    const r = pickArticleUpdate({
      title: 'Corrected headline',
      id: 999, publishedAt: '2001-01-01', createdAt: '2001-01-01', legacyId: 1, legacyUrl: '/x',
      legacyHits: 5, aiGenerated: true, aiReviewed: true, ccScore: 100, lang: 'fr',
      fbPostedAt: null, twitterPostedAt: null, scheduledAt: '2030-01-01', perspectives: {},
    })
    assert.ok(r.ok)
    if (!r.ok) return
    assert.deepEqual(r.update, { title: 'Corrected headline' })
    for (const k of ['id', 'publishedAt', 'createdAt', 'aiGenerated', 'ccScore', 'fbPostedAt']) {
      assert.ok(r.dropped.includes(k), `${k} should be dropped`)
    }
  })

  test('legitimate editor payload is preserved', async () => {
    const { pickArticleUpdate } = await import('@/lib/articles/update-fields')
    const payload = {
      title: 't', slug: 's', body: '<p>b</p>', excerpt: 'e', categoryId: 3,
      featuredImage: 'https://x/y.webp', imageAlt: 'a', imageCaption: 'c', canonicalUrl: null,
      status: 'published', isBreaking: false, isFeatured: true, isLive: 0,
      countryTags: ['CM'], summary: ['one'], metaTitle: 'm', metaDesc: 'd', authorId: 4,
    }
    const r = pickArticleUpdate(payload)
    assert.ok(r.ok)
    if (r.ok) {
      assert.deepEqual(r.update, payload)
      assert.deepEqual(r.dropped, [])
    }
  })

  test('invalid status is rejected', async () => {
    const { pickArticleUpdate } = await import('@/lib/articles/update-fields')
    const r = pickArticleUpdate({ status: 'hacked' })
    assert.equal(r.ok, false)
  })

  test('non-object bodies are rejected', async () => {
    const { pickArticleUpdate } = await import('@/lib/articles/update-fields')
    assert.equal(pickArticleUpdate(null).ok, false)
    assert.equal(pickArticleUpdate([1, 2]).ok, false)
    assert.equal(pickArticleUpdate('x').ok, false)
  })

  test('body HTML is sanitised', async () => {
    const { pickArticleUpdate } = await import('@/lib/articles/update-fields')
    const r = pickArticleUpdate({ body: '<p>ok</p><script>alert(1)</script><img src=x onerror=alert(1)>' })
    assert.ok(r.ok)
    if (r.ok) {
      assert.doesNotMatch(String(r.update.body), /script|onerror/i)
      assert.match(String(r.update.body), /<p>ok<\/p>/)
    }
  })
})
