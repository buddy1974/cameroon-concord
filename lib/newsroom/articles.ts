/**
 * Article service for the newsroom API (contract §5–§7).
 * Pure business logic over the NewsroomStore interface — no Next.js, no DB driver.
 * Publishing here never triggers social posting, IndexNow, push or scrapes.
 */
import { createHash } from 'node:crypto'
import slugify from 'slugify'
import { sanitizeArticleBody } from '@/lib/sanitize'
import { SITE_URL } from '@/lib/constants'
import { NewsroomError } from './http'
import { canUpdateArticle, requireRole, type Actor } from './permissions'
import {
  DuplicateSlugError,
  type ArticleGuard, type ArticlePatch, type ArticleRecord, type CategoryRow,
  type CcArticleStatus, type NewsroomStore,
} from './store'

export interface ServiceDeps {
  store: NewsroomStore
  now: () => Date
  /** Invalidate public caches for an article (no-op in tests / outside a request). */
  onPublicChange: (categorySlug: string | null, slug: string) => void
}

// ── Response mapping ──────────────────────────────────────────────────────────

export interface ArticleSummaryDto {
  id: number
  title: string
  slug: string
  status: CcArticleStatus
  categoryId: number
  categorySlug: string | null
  categoryName: string | null
  publishedAt: string | null
  scheduledAt: string | null
  updatedAt: string | null
  url: string | null
}

export interface ArticleDto extends ArticleSummaryDto {
  subtitle: string | null
  excerpt: string | null
  body: string
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
  version: string
  createdViaNewsroom: boolean
}

export function isoOrNull(d: Date | null | undefined): string | null {
  if (!d) return null
  const t = d.getTime()
  return Number.isFinite(t) ? new Date(t).toISOString() : null
}

export function publicUrl(a: Pick<ArticleRecord, 'status' | 'categorySlug' | 'slug'>): string | null {
  return a.status === 'published' && a.categorySlug ? `${SITE_URL}/${a.categorySlug}/${a.slug}` : null
}

/** Contract §7 — first 16 hex chars of sha256 over the listed stored fields. */
export function computeVersion(a: ArticleRecord): string {
  const tuple = [
    a.status, a.title, a.subtitle ?? null, a.body, a.excerpt ?? null, a.categoryId, a.authorId ?? null,
    a.featuredImage ?? null, a.imageAlt ?? null, a.imageCaption ?? null, a.metaTitle ?? null, a.metaDesc ?? null,
    !!a.isBreaking, isoOrNull(a.publishedAt), isoOrNull(a.scheduledAt), isoOrNull(a.updatedAt),
  ]
  return createHash('sha256').update(JSON.stringify(tuple)).digest('hex').slice(0, 16)
}

export function toSummary(a: ArticleRecord): ArticleSummaryDto {
  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    status: a.status,
    categoryId: a.categoryId,
    categorySlug: a.categorySlug,
    categoryName: a.categoryName,
    publishedAt: isoOrNull(a.publishedAt),
    scheduledAt: isoOrNull(a.scheduledAt),
    updatedAt: isoOrNull(a.updatedAt),
    url: publicUrl(a),
  }
}

export function toArticle(a: ArticleRecord): ArticleDto {
  return {
    ...toSummary(a),
    subtitle: a.subtitle,
    excerpt: a.excerpt,
    body: a.body,
    authorId: a.authorId,
    authorName: a.authorName,
    featuredImage: a.featuredImage,
    imageAlt: a.imageAlt,
    imageCaption: a.imageCaption,
    metaTitle: a.metaTitle,
    metaDesc: a.metaDesc,
    isBreaking: !!a.isBreaking,
    isFeatured: !!a.isFeatured,
    aiGenerated: !!a.aiGenerated,
    version: computeVersion(a),
    createdViaNewsroom: a.originTelegramUserId !== null,
  }
}

// ── Input validation ─────────────────────────────────────────────────────────

type Fields = Record<string, string>

function asObject(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new NewsroomError('BAD_REQUEST', 'Request body must be a JSON object')
  }
  return raw as Record<string, unknown>
}

function fail(fields: Fields): never {
  throw new NewsroomError('VALIDATION', 'Validation failed', fields)
}

function optText(v: unknown, field: string, max: number, fields: Fields): string | null | undefined {
  if (v === undefined) return undefined
  if (v === null) return null
  if (typeof v !== 'string') { fields[field] = 'must be a string or null'; return undefined }
  const s = v.trim()
  if (s.length > max) { fields[field] = `must be at most ${max} characters`; return undefined }
  return s === '' ? null : s
}

function optUrl(v: unknown, field: string, fields: Fields): string | null | undefined {
  const s = optText(v, field, 512, fields)
  if (s && !/^https?:\/\/[^\s]+$/i.test(s)) { fields[field] = 'must be an http(s) URL'; return undefined }
  return s
}

function optBool(v: unknown, field: string, fields: Fields): boolean | undefined {
  if (v === undefined) return undefined
  if (typeof v !== 'boolean') { fields[field] = 'must be a boolean'; return undefined }
  return v
}

function positiveInt(v: unknown): number | null {
  const n = typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : v
  return typeof n === 'number' && Number.isSafeInteger(n) && n > 0 ? n : null
}

function requiredTitle(v: unknown, fields: Fields): string | undefined {
  if (typeof v !== 'string' || !v.trim()) { fields.title = 'is required'; return undefined }
  const s = v.trim()
  if (s.length > 320) { fields.title = 'must be at most 320 characters'; return undefined }
  return s
}

function requiredBody(v: unknown, fields: Fields): string | undefined {
  if (typeof v !== 'string' || !v.trim()) { fields.body = 'is required'; return undefined }
  const clean = sanitizeArticleBody(v)
  if (!clean.trim()) { fields.body = 'is empty after sanitisation'; return undefined }
  return clean
}

async function resolveCategory(
  store: NewsroomStore, input: Record<string, unknown>, required: boolean, fields: Fields,
): Promise<CategoryRow | null | undefined> {
  const hasId = input.categoryId !== undefined && input.categoryId !== null
  const hasSlug = input.categorySlug !== undefined && input.categorySlug !== null
  if (!hasId && !hasSlug) {
    if (required) fields.categoryId = 'categoryId or categorySlug is required'
    return undefined
  }
  if (hasId) {
    const id = positiveInt(input.categoryId)
    const cat = id ? await store.getCategoryById(id) : null
    if (!cat) { fields.categoryId = 'unknown category'; return null }
    if (hasSlug && cat.slug !== input.categorySlug) { fields.categorySlug = 'does not match categoryId'; return null }
    return cat
  }
  const slug = typeof input.categorySlug === 'string' ? input.categorySlug.trim() : ''
  const cat = slug ? await store.getCategoryBySlug(slug) : null
  if (!cat) { fields.categorySlug = 'unknown category'; return null }
  return cat
}

async function resolveAuthorId(
  store: NewsroomStore, v: unknown, fields: Fields,
): Promise<number | null | undefined> {
  if (v === undefined) return undefined
  if (v === null) return null
  const id = positiveInt(v)
  if (!id || !(await store.getAuthorById(id))) { fields.authorId = 'unknown author'; return undefined }
  return id
}

// ── Slugs ────────────────────────────────────────────────────────────────────

const MAX_SLUG_BASE = 200

export function baseSlug(title: string): string {
  const s = slugify(title, { lower: true, strict: true, trim: true })
    .slice(0, MAX_SLUG_BASE)
    .replace(/-+$/g, '')
  return s || 'article'
}

async function uniqueSlug(store: NewsroomStore, base: string, startAt = 1): Promise<string> {
  for (let n = startAt; n < startAt + 50; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`
    if (!(await store.slugExists(candidate))) return candidate
  }
  throw new NewsroomError('INVALID_STATE', 'Could not allocate a unique slug')
}

// ── Reads ────────────────────────────────────────────────────────────────────

export const CC_STATUSES: readonly CcArticleStatus[] = ['draft', 'scheduled', 'published', 'archived']

export async function getArticleOr404(store: NewsroomStore, id: number): Promise<ArticleRecord> {
  const a = Number.isSafeInteger(id) && id > 0 ? await store.getArticle(id) : null
  if (!a) throw new NewsroomError('NOT_FOUND', 'Article not found')
  return a
}

export function parseArticleId(raw: string): number {
  const id = positiveInt(raw)
  if (!id) throw new NewsroomError('NOT_FOUND', 'Article not found')
  return id
}

export async function listArticles(store: NewsroomStore, params: URLSearchParams): Promise<ArticleSummaryDto[]> {
  const fields: Fields = {}
  const q = (params.get('q') ?? '').trim().slice(0, 200) || undefined

  let statuses: CcArticleStatus[] | undefined
  const statusParam = (params.get('status') ?? '').trim()
  if (statusParam) {
    const list = statusParam.split(',').map((s) => s.trim()).filter(Boolean)
    const bad = list.filter((s) => !(CC_STATUSES as readonly string[]).includes(s))
    if (bad.length) fields.status = `unsupported status: ${bad.join(', ')}`
    statuses = list.filter((s): s is CcArticleStatus => (CC_STATUSES as readonly string[]).includes(s))
  }

  let categoryId: number | undefined
  const category = (params.get('category') ?? '').trim()
  if (category) {
    const cat = positiveInt(category)
      ? await store.getCategoryById(Number(category))
      : await store.getCategoryBySlug(category)
    if (!cat) return []
    categoryId = cat.id
  }

  const date = (key: 'since' | 'until'): Date | undefined => {
    const v = params.get(key)
    if (!v) return undefined
    const d = new Date(v)
    if (!Number.isFinite(d.getTime())) { fields[key] = 'must be an ISO 8601 date'; return undefined }
    return d
  }
  const since = date('since')
  const until = date('until')

  const rawLimit = params.get('limit')
  let limit = 10
  if (rawLimit !== null && rawLimit !== '') {
    const n = positiveInt(rawLimit)
    if (!n) fields.limit = 'must be a positive integer'
    else limit = Math.min(n, 50)
  }
  if (Object.keys(fields).length) fail(fields)

  const rows = await store.listArticles({ q, statuses, categoryId, since, until, limit })
  return rows.map(toSummary)
}

// ── Writes ───────────────────────────────────────────────────────────────────

export interface WriteResult {
  article: ArticleDto
  articleId: number
  changedFields: string[]
}

const DRAFT_INPUT_FIELDS = [
  'title', 'body', 'excerpt', 'subtitle', 'categoryId', 'categorySlug', 'authorId',
  'featuredImage', 'imageAlt', 'imageCaption', 'metaTitle', 'metaDesc', 'isBreaking', 'aiAssisted',
] as const

export async function createDraft(deps: ServiceDeps, actor: Actor, raw: unknown): Promise<WriteResult> {
  requireRole(actor, 'contributor')
  const input = asObject(raw)
  const { store } = deps
  const fields: Fields = {}

  const title = requiredTitle(input.title, fields)
  const body = requiredBody(input.body, fields)
  const excerpt = optText(input.excerpt, 'excerpt', 5000, fields)
  const subtitle = optText(input.subtitle, 'subtitle', 320, fields)
  const featuredImage = optUrl(input.featuredImage, 'featuredImage', fields)
  const imageAlt = optText(input.imageAlt, 'imageAlt', 255, fields)
  const imageCaption = optText(input.imageCaption, 'imageCaption', 512, fields)
  const metaTitle = optText(input.metaTitle, 'metaTitle', 160, fields)
  const metaDesc = optText(input.metaDesc, 'metaDesc', 320, fields)
  const isBreaking = optBool(input.isBreaking, 'isBreaking', fields)
  const aiAssisted = optBool(input.aiAssisted, 'aiAssisted', fields)
  const category = await resolveCategory(store, input, true, fields)
  const authorId = await resolveAuthorId(store, input.authorId, fields)
  if (Object.keys(fields).length || !title || !body || !category) fail(fields)

  const now = deps.now()
  const base = baseSlug(title)
  let slug = await uniqueSlug(store, base)
  const values = {
    title, body,
    subtitle: subtitle ?? null,
    excerpt: excerpt ?? null,
    categoryId: category.id,
    authorId: authorId ?? null,
    featuredImage: featuredImage ?? null,
    imageAlt: imageAlt ?? null,
    imageCaption: imageCaption ?? null,
    metaTitle: metaTitle ?? null,
    metaDesc: metaDesc ?? null,
    isBreaking: isBreaking ?? false,
    aiGenerated: aiAssisted === true,
    aiReviewed: false,
    createdAt: now,
    updatedAt: now,
  }

  let id: number | null = null
  for (let attempt = 0; attempt < 3 && id === null; attempt++) {
    try {
      id = await store.insertArticle({ ...values, slug })
    } catch (err) {
      if (!(err instanceof DuplicateSlugError)) throw err
      slug = await uniqueSlug(store, base, 2 + attempt) // lost a race — try the next suffix
    }
  }
  if (id === null) throw new NewsroomError('INVALID_STATE', 'Could not allocate a unique slug')

  if (actor.telegramUserId) await store.recordOrigin(id, actor.telegramUserId)
  const created = await getArticleOr404(store, id)
  const changedFields = DRAFT_INPUT_FIELDS.filter((f) => input[f] !== undefined).map(String)
  return { article: toArticle(created), articleId: id, changedFields }
}

export const PATCHABLE_FIELDS = [
  'title', 'subtitle', 'body', 'excerpt', 'categoryId', 'categorySlug', 'authorId',
  'featuredImage', 'imageAlt', 'imageCaption', 'metaTitle', 'metaDesc', 'isBreaking',
] as const

function requireVersion(input: Record<string, unknown>): string {
  const v = input.expectedVersion
  if (typeof v !== 'string' || !v) fail({ expectedVersion: 'is required' })
  return v
}

function checkVersion(article: ArticleRecord, expected: string): void {
  if (computeVersion(article) !== expected) {
    throw new NewsroomError('VERSION_CONFLICT', 'Article changed since it was read; re-read and retry')
  }
}

function guardOf(a: ArticleRecord): ArticleGuard {
  return { status: a.status, updatedAt: a.updatedAt }
}

async function applyUpdate(
  deps: ServiceDeps, article: ArticleRecord, patch: ArticlePatch,
): Promise<ArticleRecord> {
  const ok = await deps.store.updateArticle(article.id, patch, guardOf(article))
  if (!ok) throw new NewsroomError('VERSION_CONFLICT', 'Article changed since it was read; re-read and retry')
  return getArticleOr404(deps.store, article.id)
}

function notifyPublic(deps: ServiceDeps, ...records: ArticleRecord[]): void {
  const seen = new Set<string>()
  for (const r of records) {
    const key = `${r.categorySlug}/${r.slug}`
    if (seen.has(key)) continue
    seen.add(key)
    try { deps.onPublicChange(r.categorySlug, r.slug) } catch { /* never fail a write on cache invalidation */ }
  }
}

export async function updateArticle(
  deps: ServiceDeps, actor: Actor, id: number, raw: unknown,
): Promise<WriteResult> {
  requireRole(actor, 'contributor')
  const input = asObject(raw)
  const allowed = new Set<string>([...PATCHABLE_FIELDS, 'expectedVersion'])
  const unknown = Object.keys(input).filter((k) => !allowed.has(k))
  if (unknown.length) {
    fail(Object.fromEntries(unknown.map((k) => [k, 'field is not patchable'])))
  }
  const expectedVersion = requireVersion(input)
  const present = PATCHABLE_FIELDS.filter((f) => input[f] !== undefined)
  if (!present.length) fail({ _: 'no patchable fields supplied' })

  const { store } = deps
  const article = await getArticleOr404(store, id)
  if (!canUpdateArticle(actor, article)) {
    throw new NewsroomError('FORBIDDEN', 'You may not edit this article')
  }
  checkVersion(article, expectedVersion)

  const fields: Fields = {}
  const patch: ArticlePatch = { updatedAt: deps.now() }
  if (input.title !== undefined) patch.title = requiredTitle(input.title, fields)
  if (input.body !== undefined) patch.body = requiredBody(input.body, fields)
  const assign = <K extends keyof ArticlePatch>(k: K, v: ArticlePatch[K] | undefined) => {
    if (v !== undefined) patch[k] = v
  }
  assign('subtitle', optText(input.subtitle, 'subtitle', 320, fields))
  assign('excerpt', optText(input.excerpt, 'excerpt', 5000, fields))
  assign('featuredImage', optUrl(input.featuredImage, 'featuredImage', fields))
  assign('imageAlt', optText(input.imageAlt, 'imageAlt', 255, fields))
  assign('imageCaption', optText(input.imageCaption, 'imageCaption', 512, fields))
  assign('metaTitle', optText(input.metaTitle, 'metaTitle', 160, fields))
  assign('metaDesc', optText(input.metaDesc, 'metaDesc', 320, fields))
  assign('isBreaking', optBool(input.isBreaking, 'isBreaking', fields))
  if (input.categoryId !== undefined || input.categorySlug !== undefined) {
    const cat = await resolveCategory(store, input, true, fields)
    if (cat) patch.categoryId = cat.id
  }
  assign('authorId', await resolveAuthorId(store, input.authorId, fields))
  if (Object.keys(fields).length) fail(fields)

  const updated = await applyUpdate(deps, article, patch)
  if (article.status === 'published') notifyPublic(deps, article, updated)
  return { article: toArticle(updated), articleId: id, changedFields: present.map(String) }
}

async function transition(
  deps: ServiceDeps, actor: Actor, id: number, raw: unknown,
  from: CcArticleStatus[], build: (a: ArticleRecord, input: Record<string, unknown>) => ArticlePatch,
): Promise<{ before: ArticleRecord; after: ArticleRecord }> {
  requireRole(actor, 'publisher')
  const input = asObject(raw ?? {})
  const expectedVersion = requireVersion(input)
  const article = await getArticleOr404(deps.store, id)
  checkVersion(article, expectedVersion)
  if (!from.includes(article.status)) {
    throw new NewsroomError('INVALID_STATE', `Cannot do this while the article is ${article.status}`)
  }
  const patch = build(article, input)
  const after = await applyUpdate(deps, article, patch)
  return { before: article, after }
}

export async function publishArticle(deps: ServiceDeps, actor: Actor, id: number, raw: unknown): Promise<WriteResult> {
  const now = deps.now()
  const { before, after } = await transition(deps, actor, id, raw, ['draft', 'scheduled'], () => ({
    status: 'published', publishedAt: now, updatedAt: now,
  }))
  notifyPublic(deps, before, after)
  return { article: toArticle(after), articleId: id, changedFields: ['status', 'publishedAt'] }
}

/** CC has no `unpublished` status: unpublish returns the article to draft, keeping published_at. */
export async function unpublishArticle(deps: ServiceDeps, actor: Actor, id: number, raw: unknown): Promise<WriteResult> {
  const now = deps.now()
  const { before, after } = await transition(deps, actor, id, raw, ['published'], () => ({
    status: 'draft', updatedAt: now,
  }))
  notifyPublic(deps, before, after)
  return { article: toArticle(after), articleId: id, changedFields: ['status'] }
}

export const MIN_SCHEDULE_LEAD_SECONDS = 60

export async function scheduleArticle(deps: ServiceDeps, actor: Actor, id: number, raw: unknown): Promise<WriteResult> {
  const now = deps.now()
  const { after } = await transition(deps, actor, id, raw, ['draft'], (_a, input) => {
    const v = input.scheduledAt
    const when = typeof v === 'string' ? new Date(v) : null
    if (!when || !Number.isFinite(when.getTime())) fail({ scheduledAt: 'must be an ISO 8601 date-time' })
    if (when.getTime() < now.getTime() + MIN_SCHEDULE_LEAD_SECONDS * 1000) {
      fail({ scheduledAt: `must be at least ${MIN_SCHEDULE_LEAD_SECONDS} seconds in the future` })
    }
    return { status: 'scheduled', scheduledAt: when, updatedAt: now }
  })
  return { article: toArticle(after), articleId: id, changedFields: ['status', 'scheduledAt'] }
}

export async function unscheduleArticle(deps: ServiceDeps, actor: Actor, id: number, raw: unknown): Promise<WriteResult> {
  const now = deps.now()
  const { after } = await transition(deps, actor, id, raw, ['scheduled'], () => ({
    status: 'draft', scheduledAt: null, updatedAt: now,
  }))
  return { article: toArticle(after), articleId: id, changedFields: ['status', 'scheduledAt'] }
}

export const PUBLISH_DUE_BATCH = 50

/**
 * Publishes scheduled articles whose time has come; published_at = scheduled_at.
 * Each row is guarded, so concurrent runs (cron + TM) cannot double-publish.
 */
export async function publishDue(
  deps: ServiceDeps,
  audit?: { requestId: string; actor: string; idempotencyKey: string | null },
): Promise<{ published: number[] }> {
  const now = deps.now()
  const due = await deps.store.listDueScheduled(now, PUBLISH_DUE_BATCH)
  const published: number[] = []
  for (const a of due) {
    const ok = await deps.store.updateArticle(
      a.id,
      { status: 'published', publishedAt: a.scheduledAt ?? now, updatedAt: now },
      guardOf(a),
    )
    if (!ok) continue
    published.push(a.id)
    notifyPublic(deps, a)
    if (audit) {
      await deps.store.appendAudit({
        requestId: audit.requestId, actor: audit.actor, operation: 'article.publish_scheduled',
        articleId: a.id, changedFields: ['status', 'publishedAt'], idempotencyKey: audit.idempotencyKey,
        result: 'ok', errorCode: null,
      }).catch(() => {})
    }
  }
  return { published }
}
