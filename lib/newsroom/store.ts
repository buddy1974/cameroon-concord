/**
 * Persistence boundary for the newsroom API. Business logic only talks to this
 * interface; store-mysql.ts is the production implementation and
 * tests/newsroom/store-memory.ts the in-memory one used by the test suite.
 */
import type { NonceStore } from './verify'

export type Role = 'viewer' | 'contributor' | 'editor' | 'publisher'
export type CcArticleStatus = 'draft' | 'scheduled' | 'published' | 'archived'

export interface GrantRow {
  telegramUserId: string
  role: Role
  active: boolean
  displayName: string | null
}

export interface CategoryRow { id: number; slug: string; name: string }
export interface AuthorRow { id: number; slug: string; name: string }

/** An `articles` row plus the joined fields the API exposes. */
export interface ArticleRecord {
  id: number
  slug: string
  title: string
  subtitle: string | null
  body: string
  excerpt: string | null
  categoryId: number
  categorySlug: string | null
  categoryName: string | null
  authorId: number | null
  authorName: string | null
  featuredImage: string | null
  imageAlt: string | null
  imageCaption: string | null
  metaTitle: string | null
  metaDesc: string | null
  isBreaking: boolean
  isFeatured: boolean
  aiGenerated: boolean
  status: CcArticleStatus
  publishedAt: Date | null
  scheduledAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
  /** Telegram user id that created the article through the newsroom API, if any. */
  originTelegramUserId: string | null
}

export interface NewArticleValues {
  slug: string
  title: string
  subtitle: string | null
  body: string
  excerpt: string | null
  categoryId: number
  authorId: number | null
  featuredImage: string | null
  imageAlt: string | null
  imageCaption: string | null
  metaTitle: string | null
  metaDesc: string | null
  isBreaking: boolean
  aiGenerated: boolean
  aiReviewed: boolean
  createdAt: Date
  updatedAt: Date
}

/** Columns the newsroom API may change on an existing article. Slug is deliberately absent. */
export interface ArticlePatch {
  title?: string
  subtitle?: string | null
  body?: string
  excerpt?: string | null
  categoryId?: number
  authorId?: number | null
  featuredImage?: string | null
  imageAlt?: string | null
  imageCaption?: string | null
  metaTitle?: string | null
  metaDesc?: string | null
  isBreaking?: boolean
  status?: CcArticleStatus
  publishedAt?: Date | null
  scheduledAt?: Date | null
  updatedAt: Date
}

/** Optimistic guard: the update only applies while the row still has these values. */
export interface ArticleGuard {
  status: CcArticleStatus
  updatedAt: Date | null
}

export interface ArticleListFilter {
  q?: string
  statuses?: CcArticleStatus[]
  categoryId?: number
  since?: Date
  until?: Date
  limit: number
}

export interface IdempotencyRecord {
  key: string
  actor: string
  method: string
  path: string
  requestHash: string
  /** 0 while the request is in flight. */
  statusCode: number
  responseJson: string | null
  createdAt: Date
}

export interface AuditEntry {
  requestId: string
  actor: string
  operation: string
  articleId: number | null
  changedFields: string[] | null
  idempotencyKey: string | null
  result: 'ok' | 'denied' | 'error'
  errorCode: string | null
}

export interface NewMediaValues {
  r2Key: string
  cdnUrl: string
  mimeType: string
  width: number | null
  height: number | null
  sizeBytes: number
  alt: string | null
  articleId: number | null
}

export interface NewsroomStore extends NonceStore {
  getGrant(telegramUserId: string): Promise<GrantRow | null>

  /** Inserts a pending record. Returns null on success, or the existing record for (key, actor). */
  reserveIdempotency(rec: IdempotencyRecord): Promise<IdempotencyRecord | null>
  completeIdempotency(key: string, actor: string, statusCode: number, responseJson: string): Promise<void>
  releaseIdempotency(key: string, actor: string): Promise<void>

  appendAudit(entry: AuditEntry): Promise<void>

  recordOrigin(articleId: number, telegramUserId: string): Promise<void>

  listCategories(): Promise<CategoryRow[]>
  getCategoryById(id: number): Promise<CategoryRow | null>
  getCategoryBySlug(slug: string): Promise<CategoryRow | null>
  listAuthors(): Promise<AuthorRow[]>
  getAuthorById(id: number): Promise<AuthorRow | null>

  getArticle(id: number): Promise<ArticleRecord | null>
  listArticles(filter: ArticleListFilter): Promise<ArticleRecord[]>
  slugExists(slug: string): Promise<boolean>
  /** Returns the new id. Must throw DuplicateSlugError on a slug unique-key collision. */
  insertArticle(values: NewArticleValues): Promise<number>
  /** Returns false when the guard no longer matches (concurrent change). */
  updateArticle(id: number, patch: ArticlePatch, guard: ArticleGuard): Promise<boolean>
  listDueScheduled(now: Date, limit: number): Promise<ArticleRecord[]>

  mediaKeyExists(r2Key: string): Promise<boolean>
  insertMedia(values: NewMediaValues): Promise<number>
}

export class DuplicateSlugError extends Error {
  constructor() {
    super('Duplicate slug')
    this.name = 'DuplicateSlugError'
  }
}
