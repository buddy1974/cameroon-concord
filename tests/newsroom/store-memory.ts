/**
 * In-memory NewsroomStore for tests. Mirrors the MySQL semantics that matter:
 * unique nonces, (key, actor) idempotency PK, unique slugs, guarded updates,
 * and whole-second DATETIME precision.
 */
import {
  DuplicateSlugError,
  type ArticleGuard, type ArticleListFilter, type ArticlePatch, type ArticleRecord, type AuditEntry,
  type AuthorRow, type CategoryRow, type GrantRow, type IdempotencyRecord, type NewArticleValues,
  type NewMediaValues, type NewsroomStore, type CcArticleStatus,
} from '@/lib/newsroom/store'

type StoredArticle = Omit<ArticleRecord, 'categorySlug' | 'categoryName' | 'authorName' | 'originTelegramUserId'>

const sec = (d: Date | null | undefined): Date | null =>
  d ? new Date(Math.floor(d.getTime() / 1000) * 1000) : null

export class MemoryStore implements NewsroomStore {
  nonces = new Map<string, Date>()
  grants = new Map<string, GrantRow>()
  idempotency = new Map<string, IdempotencyRecord>()
  audit: AuditEntry[] = []
  origins = new Map<number, string>()
  categories: CategoryRow[] = [
    { id: 1, slug: 'politics', name: 'Politics' },
    { id: 9, slug: 'headlines', name: 'Headlines' },
  ]
  authors: AuthorRow[] = [{ id: 3, slug: 'desk', name: 'News Desk' }]
  articles = new Map<number, StoredArticle>()
  media: Array<NewMediaValues & { id: number }> = []
  calls: string[] = []
  insertCount = 0
  private nextId = 100

  grant(telegramUserId: string, role: GrantRow['role'], active = true): this {
    this.grants.set(telegramUserId, { telegramUserId, role, active, displayName: null })
    return this
  }

  /** Seeds an article as if written by the CMS (no newsroom origin unless given). */
  seedArticle(over: Partial<StoredArticle> & { origin?: string } = {}): number {
    const id = over.id ?? this.nextId++
    const now = sec(new Date('2026-01-01T10:00:00Z'))!
    const { origin, ...rest } = over
    this.articles.set(id, {
      id, slug: `seed-${id}`, title: `Seed ${id}`, subtitle: null, body: '<p>seed</p>', excerpt: null,
      categoryId: 1, authorId: null, featuredImage: null, imageAlt: null, imageCaption: null,
      metaTitle: null, metaDesc: null, isBreaking: false, isFeatured: false, aiGenerated: false,
      status: 'draft', publishedAt: null, scheduledAt: null, createdAt: now, updatedAt: now,
      ...rest,
    })
    if (origin) this.origins.set(id, origin)
    return id
  }

  private join(a: StoredArticle): ArticleRecord {
    const cat = this.categories.find((c) => c.id === a.categoryId)
    const author = a.authorId ? this.authors.find((x) => x.id === a.authorId) : undefined
    return {
      ...a,
      categorySlug: cat?.slug ?? null,
      categoryName: cat?.name ?? null,
      authorName: author?.name ?? null,
      originTelegramUserId: this.origins.get(a.id) ?? null,
    }
  }

  private track(name: string) { this.calls.push(name) }

  async consumeNonce(nonce: string, expiresAt: Date) {
    this.track('consumeNonce')
    if (this.nonces.has(nonce)) return false
    this.nonces.set(nonce, expiresAt)
    return true
  }
  async getGrant(id: string) { this.track('getGrant'); return this.grants.get(id) ?? null }

  async reserveIdempotency(rec: IdempotencyRecord) {
    this.track('reserveIdempotency')
    const k = `${rec.key}\u0000${rec.actor}`
    const existing = this.idempotency.get(k)
    if (existing) return { ...existing }
    this.idempotency.set(k, { ...rec })
    return null
  }
  async completeIdempotency(key: string, actor: string, statusCode: number, responseJson: string) {
    const r = this.idempotency.get(`${key}\u0000${actor}`)
    if (r) { r.statusCode = statusCode; r.responseJson = responseJson }
  }
  async releaseIdempotency(key: string, actor: string) {
    const k = `${key}\u0000${actor}`
    if (this.idempotency.get(k)?.statusCode === 0) this.idempotency.delete(k)
  }

  async appendAudit(e: AuditEntry) { this.track('appendAudit'); this.audit.push({ ...e }) }
  async recordOrigin(articleId: number, telegramUserId: string) { this.origins.set(articleId, telegramUserId) }

  async listCategories() { this.track('listCategories'); return [...this.categories] }
  async getCategoryById(id: number) { return this.categories.find((c) => c.id === id) ?? null }
  async getCategoryBySlug(slug: string) { return this.categories.find((c) => c.slug === slug) ?? null }
  async listAuthors() { return [...this.authors] }
  async getAuthorById(id: number) { return this.authors.find((a) => a.id === id) ?? null }

  async getArticle(id: number) {
    this.track('getArticle')
    const a = this.articles.get(id)
    return a ? this.join(a) : null
  }
  async listArticles(f: ArticleListFilter) {
    let rows = [...this.articles.values()]
    if (f.q) {
      const q = f.q.toLowerCase()
      rows = rows.filter((a) => a.title.toLowerCase().includes(q) || (a.excerpt ?? '').toLowerCase().includes(q))
    }
    if (f.statuses?.length) rows = rows.filter((a) => f.statuses!.includes(a.status))
    if (f.categoryId) rows = rows.filter((a) => a.categoryId === f.categoryId)
    if (f.since) rows = rows.filter((a) => a.updatedAt && a.updatedAt >= f.since!)
    if (f.until) rows = rows.filter((a) => a.updatedAt && a.updatedAt <= f.until!)
    rows.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0) || b.id - a.id)
    return rows.slice(0, f.limit).map((a) => this.join(a))
  }
  async slugExists(slug: string) { return [...this.articles.values()].some((a) => a.slug === slug) }

  async insertArticle(v: NewArticleValues) {
    this.track('insertArticle')
    if (await this.slugExists(v.slug)) throw new DuplicateSlugError()
    this.insertCount++
    const id = this.nextId++
    this.articles.set(id, {
      id, slug: v.slug, title: v.title, subtitle: v.subtitle, body: v.body, excerpt: v.excerpt,
      categoryId: v.categoryId, authorId: v.authorId, featuredImage: v.featuredImage, imageAlt: v.imageAlt,
      imageCaption: v.imageCaption, metaTitle: v.metaTitle, metaDesc: v.metaDesc, isBreaking: v.isBreaking,
      isFeatured: false, aiGenerated: v.aiGenerated, status: 'draft' as CcArticleStatus,
      publishedAt: null, scheduledAt: null, createdAt: sec(v.createdAt), updatedAt: sec(v.updatedAt),
    })
    this.aiReviewed.set(id, v.aiReviewed)
    return id
  }
  aiReviewed = new Map<number, boolean>()

  async updateArticle(id: number, p: ArticlePatch, guard: ArticleGuard) {
    this.track('updateArticle')
    const a = this.articles.get(id)
    if (!a) return false
    if (a.status !== guard.status) return false
    if ((a.updatedAt?.getTime() ?? null) !== (guard.updatedAt?.getTime() ?? null)) return false
    const next: StoredArticle = { ...a }
    for (const [k, v] of Object.entries(p)) {
      if (v === undefined) continue
      ;(next as Record<string, unknown>)[k] = v instanceof Date ? sec(v) : v
    }
    this.articles.set(id, next)
    return true
  }
  async listDueScheduled(now: Date, limit: number) {
    return [...this.articles.values()]
      .filter((a) => a.status === 'scheduled' && a.scheduledAt && a.scheduledAt <= now)
      .sort((a, b) => a.scheduledAt!.getTime() - b.scheduledAt!.getTime())
      .slice(0, limit)
      .map((a) => this.join(a))
  }

  async mediaKeyExists(key: string) { return this.media.some((m) => m.r2Key === key) }
  async insertMedia(v: NewMediaValues) {
    const id = this.media.length + 1
    this.media.push({ ...v, id })
    return id
  }
}

/** A store that records any access — used to prove auth fails before the DB is touched. */
export function tripwireStore(): { store: NewsroomStore; touched: string[] } {
  const touched: string[] = []
  const store = new Proxy({} as NewsroomStore, {
    get(_t, prop) {
      if (prop === 'then') return undefined
      return async () => { touched.push(String(prop)); throw new Error('store must not be touched') }
    },
  })
  return { store, touched }
}
