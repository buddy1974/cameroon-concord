/**
 * MySQL (drizzle) implementation of NewsroomStore.
 * Explicit column mapping only — nothing outside the newsroom allowlist is ever written.
 * Imported lazily by handler.ts so unauthenticated requests never open a DB pool.
 */
import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, like, lt, lte, or, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  articles, authors, categories, media,
  newsroomArticleOrigins, newsroomAudit, newsroomGrants, newsroomIdempotency, newsroomNonces,
} from '@/lib/db/schema'
import {
  DuplicateSlugError,
  type ArticleGuard, type ArticleListFilter, type ArticlePatch, type ArticleRecord, type AuditEntry,
  type AuthorRow, type CategoryRow, type GrantRow, type IdempotencyRecord, type NewArticleValues,
  type NewMediaValues, type NewsroomStore,
} from './store'

const IDEMPOTENCY_RETENTION_MS = 8 * 24 * 60 * 60 * 1000

function isDuplicate(err: unknown): boolean {
  const seen = new Set<unknown>()
  let e: unknown = err
  while (e && typeof e === 'object' && !seen.has(e)) {
    seen.add(e)
    const code = (e as { code?: unknown }).code
    if (code === 'ER_DUP_ENTRY' || (e as { errno?: unknown }).errno === 1062) return true
    e = (e as { cause?: unknown }).cause
  }
  return false
}

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`)
}

const articleColumns = {
  id: articles.id,
  slug: articles.slug,
  title: articles.title,
  subtitle: articles.subtitle,
  body: articles.body,
  excerpt: articles.excerpt,
  categoryId: articles.categoryId,
  categorySlug: categories.slug,
  categoryName: categories.name,
  authorId: articles.authorId,
  authorName: authors.name,
  featuredImage: articles.featuredImage,
  imageAlt: articles.imageAlt,
  imageCaption: articles.imageCaption,
  metaTitle: articles.metaTitle,
  metaDesc: articles.metaDesc,
  isBreaking: articles.isBreaking,
  isFeatured: articles.isFeatured,
  aiGenerated: articles.aiGenerated,
  status: articles.status,
  publishedAt: articles.publishedAt,
  scheduledAt: articles.scheduledAt,
  createdAt: articles.createdAt,
  updatedAt: articles.updatedAt,
  originTelegramUserId: newsroomArticleOrigins.telegramUserId,
}

type JoinedRow = {
  [K in keyof typeof articleColumns]: unknown
}

function toRecord(r: JoinedRow): ArticleRecord {
  const d = (v: unknown) => (v instanceof Date ? v : null)
  const n = (v: unknown) => (v === null || v === undefined ? null : Number(v))
  const s = (v: unknown) => (v === null || v === undefined ? null : String(v))
  return {
    id: Number(r.id),
    slug: String(r.slug),
    title: String(r.title),
    subtitle: s(r.subtitle),
    body: String(r.body ?? ''),
    excerpt: s(r.excerpt),
    categoryId: Number(r.categoryId),
    categorySlug: s(r.categorySlug),
    categoryName: s(r.categoryName),
    authorId: n(r.authorId),
    authorName: s(r.authorName),
    featuredImage: s(r.featuredImage),
    imageAlt: s(r.imageAlt),
    imageCaption: s(r.imageCaption),
    metaTitle: s(r.metaTitle),
    metaDesc: s(r.metaDesc),
    isBreaking: !!r.isBreaking,
    isFeatured: !!r.isFeatured,
    aiGenerated: !!r.aiGenerated,
    status: (r.status ?? 'draft') as ArticleRecord['status'],
    publishedAt: d(r.publishedAt),
    scheduledAt: d(r.scheduledAt),
    createdAt: d(r.createdAt),
    updatedAt: d(r.updatedAt),
    originTelegramUserId: s(r.originTelegramUserId),
  }
}

function selectArticles() {
  return db
    .select(articleColumns)
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(authors, eq(articles.authorId, authors.id))
    .leftJoin(newsroomArticleOrigins, eq(newsroomArticleOrigins.articleId, articles.id))
}

async function housekeeping(now: Date): Promise<void> {
  // Opportunistic cleanup keeps the nonce/idempotency tables small without a cron.
  if (Math.random() > 0.05) return
  try {
    await db.delete(newsroomNonces).where(lt(newsroomNonces.expiresAt, now))
    await db.delete(newsroomIdempotency)
      .where(lt(newsroomIdempotency.createdAt, new Date(now.getTime() - IDEMPOTENCY_RETENTION_MS)))
  } catch {
    /* best effort */
  }
}

export const mysqlNewsroomStore: NewsroomStore = {
  async consumeNonce(nonce, expiresAt) {
    try {
      await db.insert(newsroomNonces).values({ nonce, expiresAt })
    } catch (err) {
      if (isDuplicate(err)) return false
      throw err
    }
    void housekeeping(new Date())
    return true
  },

  async getGrant(telegramUserId): Promise<GrantRow | null> {
    const [row] = await db.select().from(newsroomGrants).where(eq(newsroomGrants.telegramUserId, BigInt(telegramUserId))).limit(1)
    if (!row) return null
    return { telegramUserId: String(row.telegramUserId), role: row.role, active: !!row.active, displayName: row.displayName ?? null }
  },

  async reserveIdempotency(rec): Promise<IdempotencyRecord | null> {
    try {
      await db.insert(newsroomIdempotency).values({
        idemKey: rec.key, actor: rec.actor, method: rec.method, path: rec.path,
        requestHash: rec.requestHash, statusCode: 0, responseJson: null, createdAt: rec.createdAt,
      })
      return null
    } catch (err) {
      if (!isDuplicate(err)) throw err
    }
    const [row] = await db.select().from(newsroomIdempotency)
      .where(and(eq(newsroomIdempotency.idemKey, rec.key), eq(newsroomIdempotency.actor, rec.actor))).limit(1)
    if (!row) return { ...rec, statusCode: 0, createdAt: new Date(0) } // vanished between insert and read: treat as stale
    return {
      key: row.idemKey, actor: row.actor, method: row.method, path: row.path, requestHash: row.requestHash,
      statusCode: row.statusCode, responseJson: row.responseJson ?? null, createdAt: row.createdAt ?? new Date(0),
    }
  },

  async completeIdempotency(key, actor, statusCode, responseJson) {
    await db.update(newsroomIdempotency).set({ statusCode, responseJson })
      .where(and(eq(newsroomIdempotency.idemKey, key), eq(newsroomIdempotency.actor, actor)))
  },

  async releaseIdempotency(key, actor) {
    await db.delete(newsroomIdempotency).where(and(
      eq(newsroomIdempotency.idemKey, key), eq(newsroomIdempotency.actor, actor), eq(newsroomIdempotency.statusCode, 0)))
  },

  async appendAudit(e: AuditEntry) {
    await db.insert(newsroomAudit).values({
      requestId: e.requestId, actor: e.actor, operation: e.operation, articleId: e.articleId,
      changedFields: e.changedFields, idempotencyKey: e.idempotencyKey, result: e.result, errorCode: e.errorCode,
      createdAt: new Date(),
    })
  },

  async recordOrigin(articleId, telegramUserId) {
    await db.insert(newsroomArticleOrigins).values({ articleId, telegramUserId: BigInt(telegramUserId), createdAt: new Date() })
      .onDuplicateKeyUpdate({ set: { articleId } })
  },

  async listCategories(): Promise<CategoryRow[]> {
    return db.select({ id: categories.id, slug: categories.slug, name: categories.name })
      .from(categories).orderBy(asc(categories.sortOrder), asc(categories.name))
  },
  async getCategoryById(id) {
    const [row] = await db.select({ id: categories.id, slug: categories.slug, name: categories.name })
      .from(categories).where(eq(categories.id, id)).limit(1)
    return row ?? null
  },
  async getCategoryBySlug(slug) {
    const [row] = await db.select({ id: categories.id, slug: categories.slug, name: categories.name })
      .from(categories).where(eq(categories.slug, slug)).limit(1)
    return row ?? null
  },
  async listAuthors(): Promise<AuthorRow[]> {
    return db.select({ id: authors.id, slug: authors.slug, name: authors.name }).from(authors).orderBy(asc(authors.name))
  },
  async getAuthorById(id) {
    const [row] = await db.select({ id: authors.id, slug: authors.slug, name: authors.name })
      .from(authors).where(eq(authors.id, id)).limit(1)
    return row ?? null
  },

  async getArticle(id) {
    const [row] = await selectArticles().where(eq(articles.id, id)).limit(1)
    return row ? toRecord(row) : null
  },

  async listArticles(f: ArticleListFilter) {
    const conds: SQL[] = []
    if (f.q) {
      const pattern = `%${escapeLike(f.q)}%`
      conds.push(or(like(articles.title, pattern), like(articles.excerpt, pattern)) as SQL)
    }
    if (f.statuses?.length) conds.push(inArray(articles.status, f.statuses))
    if (f.categoryId) conds.push(eq(articles.categoryId, f.categoryId))
    if (f.since) conds.push(gte(articles.updatedAt, f.since))
    if (f.until) conds.push(lte(articles.updatedAt, f.until))
    const rows = await selectArticles()
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(articles.updatedAt), desc(articles.id))
      .limit(f.limit)
    return rows.map(toRecord)
  },

  async slugExists(slug) {
    const [row] = await db.select({ id: articles.id }).from(articles).where(eq(articles.slug, slug)).limit(1)
    return !!row
  },

  async insertArticle(v: NewArticleValues) {
    try {
      const result = await db.insert(articles).values({
        slug: v.slug,
        title: v.title,
        subtitle: v.subtitle,
        body: v.body,
        excerpt: v.excerpt,
        categoryId: v.categoryId,
        authorId: v.authorId,
        featuredImage: v.featuredImage,
        imageAlt: v.imageAlt,
        imageCaption: v.imageCaption,
        metaTitle: v.metaTitle,
        metaDesc: v.metaDesc,
        isBreaking: v.isBreaking,
        isFeatured: false,
        aiGenerated: v.aiGenerated,
        aiReviewed: v.aiReviewed,
        status: 'draft',
        publishedAt: null,
        scheduledAt: null,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      }).$returningId()
      return result[0].id
    } catch (err) {
      if (isDuplicate(err)) throw new DuplicateSlugError()
      throw err
    }
  },

  async updateArticle(id, p: ArticlePatch, guard: ArticleGuard) {
    const set: Partial<typeof articles.$inferInsert> = { updatedAt: p.updatedAt }
    if (p.title !== undefined) set.title = p.title
    if (p.subtitle !== undefined) set.subtitle = p.subtitle
    if (p.body !== undefined) set.body = p.body
    if (p.excerpt !== undefined) set.excerpt = p.excerpt
    if (p.categoryId !== undefined) set.categoryId = p.categoryId
    if (p.authorId !== undefined) set.authorId = p.authorId
    if (p.featuredImage !== undefined) set.featuredImage = p.featuredImage
    if (p.imageAlt !== undefined) set.imageAlt = p.imageAlt
    if (p.imageCaption !== undefined) set.imageCaption = p.imageCaption
    if (p.metaTitle !== undefined) set.metaTitle = p.metaTitle
    if (p.metaDesc !== undefined) set.metaDesc = p.metaDesc
    if (p.isBreaking !== undefined) set.isBreaking = p.isBreaking
    if (p.status !== undefined) set.status = p.status
    if (p.publishedAt !== undefined) set.publishedAt = p.publishedAt
    if (p.scheduledAt !== undefined) set.scheduledAt = p.scheduledAt

    const [res] = await db.update(articles).set(set).where(and(
      eq(articles.id, id),
      eq(articles.status, guard.status),
      guard.updatedAt ? eq(articles.updatedAt, guard.updatedAt) : isNull(articles.updatedAt),
    ))
    return Number((res as { affectedRows?: number }).affectedRows ?? 0) > 0
  },

  async listDueScheduled(now, limit) {
    const rows = await selectArticles()
      .where(and(eq(articles.status, 'scheduled'), isNotNull(articles.scheduledAt), lte(articles.scheduledAt, now)))
      .orderBy(asc(articles.scheduledAt))
      .limit(limit)
    return rows.map(toRecord)
  },

  async mediaKeyExists(r2Key) {
    const [row] = await db.select({ id: media.id }).from(media).where(eq(media.r2Key, r2Key)).limit(1)
    return !!row
  },

  async insertMedia(v: NewMediaValues) {
    const result = await db.insert(media).values({
      r2Key: v.r2Key, cdnUrl: v.cdnUrl, mimeType: v.mimeType, width: v.width, height: v.height,
      sizeBytes: v.sizeBytes, alt: v.alt, articleId: v.articleId, uploadedAt: new Date(),
    }).$returningId()
    return result[0].id
  },
}
