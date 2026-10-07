/**
 * Newsroom media (contract §9). Images go through the same sharp → WebP
 * (≤ 1200 px, q82) pipeline as the CMS upload; other allowed types are stored
 * as-is. Objects live under `newsroom/<uuid>.<ext>` and are recorded in `media`.
 */
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { NewsroomError } from './http'
import { canAttachMedia, requireRole, type Actor } from './permissions'
import { computeVersion, getArticleOr404, toArticle, type ArticleDto, type ServiceDeps } from './articles'
import type { ArticlePatch, ArticleRecord } from './store'

export const MAX_DIRECT_UPLOAD_BYTES = 4 * 1024 * 1024
export const MAX_PRESIGNED_UPLOAD_BYTES = 100 * 1024 * 1024
export const PRESIGN_EXPIRES_SECONDS = 15 * 60
const MAX_PIXELS = 25_000_000

const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
}
const OTHER_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
}
const ALL_TYPES: Record<string, string> = { ...IMAGE_TYPES, ...OTHER_TYPES }
const SHARP_FORMATS = new Set(['jpeg', 'png', 'webp', 'gif'])
const MEDIA_ROLES = ['featured', 'inline', 'attachment'] as const
type MediaRole = typeof MEDIA_ROLES[number]

export function isAllowedContentType(t: string): boolean {
  return Object.prototype.hasOwnProperty.call(ALL_TYPES, t)
}
export function isImageType(t: string): boolean {
  return Object.prototype.hasOwnProperty.call(IMAGE_TYPES, t)
}

/** Storage boundary — R2 in production (media-r2.ts), a fake in tests. */
export interface MediaStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>
  head(key: string): Promise<{ contentType: string | null; sizeBytes: number } | null>
  presignPut(key: string, contentType: string, expiresInSeconds: number): Promise<string>
  publicUrl(key: string): string
}

export interface MediaDeps extends ServiceDeps {
  storage: MediaStorage | null
}

export interface MediaResultDto {
  mediaId: number
  url: string
  contentType: string
  width: number | null
  height: number | null
  sizeBytes: number
  article?: ArticleDto
}

export interface MediaWriteResult {
  data: MediaResultDto
  articleId: number | null
  changedFields: string[]
}

type Fields = Record<string, string>
function fail(fields: Fields): never {
  throw new NewsroomError('VALIDATION', 'Validation failed', fields)
}

function asObject(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new NewsroomError('BAD_REQUEST', 'Request body must be a JSON object')
  }
  return raw as Record<string, unknown>
}

function requireStorage(deps: MediaDeps): MediaStorage {
  if (!deps.storage) throw new NewsroomError('API_NOT_CONFIGURED', 'Media storage is not configured')
  return deps.storage
}

function optShortText(v: unknown, field: string, max: number, fields: Fields): string | null {
  if (v === undefined || v === null) return null
  if (typeof v !== 'string') { fields[field] = 'must be a string'; return null }
  const s = v.trim()
  if (s.length > max) { fields[field] = `must be at most ${max} characters`; return null }
  return s || null
}

/** Decodes strict base64; rejects oversize input before allocating the buffer. */
export function decodeBase64(data: unknown, maxBytes: number): Buffer {
  if (typeof data !== 'string' || !data) fail({ dataBase64: 'is required' })
  const s = data.replace(/\s+/g, '')
  if (Math.floor((s.length * 3) / 4) > maxBytes + 3) fail({ dataBase64: `decoded file must be at most ${maxBytes} bytes` })
  if (s.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(s)) fail({ dataBase64: 'is not valid base64' })
  const buf = Buffer.from(s, 'base64')
  if (buf.length === 0) fail({ dataBase64: 'file is empty' })
  if (buf.length > maxBytes) fail({ dataBase64: `decoded file must be at most ${maxBytes} bytes` })
  return buf
}

/** Light magic-byte check so a declared type matches the actual bytes. */
export function sniffMatches(contentType: string, buf: Buffer): boolean {
  const ascii = (start: number, end: number) => buf.subarray(start, end).toString('latin1')
  switch (contentType) {
    case 'application/pdf': return ascii(0, 5) === '%PDF-'
    case 'video/mp4': return ascii(4, 8) === 'ftyp'
    case 'video/quicktime': return ['ftyp', 'moov', 'mdat', 'wide', 'free', 'skip'].includes(ascii(4, 8))
    case 'audio/ogg': return ascii(0, 4) === 'OggS'
    case 'audio/mpeg': return ascii(0, 3) === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)
    default: return true
  }
}

interface Prepared { body: Buffer; contentType: string; ext: string; width: number | null; height: number | null }

async function prepareImage(buf: Buffer): Promise<Prepared> {
  let meta: sharp.Metadata
  try {
    meta = await sharp(buf, { limitInputPixels: MAX_PIXELS }).metadata()
  } catch {
    fail({ dataBase64: 'is not a readable image' })
  }
  if (!meta.width || !meta.height || !meta.format || !SHARP_FORMATS.has(meta.format)) {
    fail({ dataBase64: 'is not a supported image' })
  }
  if (meta.width * meta.height > MAX_PIXELS) fail({ dataBase64: 'image dimensions are too large' })
  const { data, info } = await sharp(buf, { limitInputPixels: MAX_PIXELS })
    .rotate()
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true })
  return { body: data, contentType: 'image/webp', ext: 'webp', width: info.width, height: info.height }
}

interface Target {
  article: ArticleRecord | null
  role: MediaRole
  alt: string | null
  caption: string | null
  expectedVersion: string | null
}

/** Validates role/article/permissions/version BEFORE anything is stored. */
async function resolveTarget(deps: MediaDeps, actor: Actor, input: Record<string, unknown>, fields: Fields): Promise<Target> {
  const roleRaw = input.role ?? 'attachment'
  const role = (MEDIA_ROLES as readonly unknown[]).includes(roleRaw) ? (roleRaw as MediaRole) : null
  if (!role) fields.role = 'must be featured, inline or attachment'
  const alt = optShortText(input.alt, 'alt', 255, fields)
  const caption = optShortText(input.caption, 'caption', 512, fields)

  let article: ArticleRecord | null = null
  if (input.articleId !== undefined && input.articleId !== null) {
    const id = typeof input.articleId === 'number' ? input.articleId : Number(input.articleId)
    if (!Number.isSafeInteger(id) || id <= 0) fields.articleId = 'must be a positive integer'
    else article = await getArticleOr404(deps.store, id)
  }
  const expectedVersion = typeof input.expectedVersion === 'string' && input.expectedVersion ? input.expectedVersion : null
  if (role === 'featured') {
    if (!article && !fields.articleId) fields.articleId = 'is required when role=featured'
    if (!expectedVersion) fields.expectedVersion = 'is required when role=featured'
  }
  if (Object.keys(fields).length) fail(fields)

  if (!canAttachMedia(actor, article)) throw new NewsroomError('FORBIDDEN', 'You may not attach media to this article')
  if (role === 'featured' && article && computeVersion(article) !== expectedVersion) {
    throw new NewsroomError('VERSION_CONFLICT', 'Article changed since it was read; re-read and retry')
  }
  return { article, role: role as MediaRole, alt, caption, expectedVersion }
}

async function recordAndAttach(
  deps: MediaDeps, target: Target, key: string, url: string,
  file: { contentType: string; width: number | null; height: number | null; sizeBytes: number },
): Promise<MediaWriteResult> {
  const mediaId = await deps.store.insertMedia({
    r2Key: key, cdnUrl: url, mimeType: file.contentType, width: file.width, height: file.height,
    sizeBytes: file.sizeBytes, alt: target.alt, articleId: target.article?.id ?? null,
  })
  const data: MediaResultDto = { mediaId, url, ...file }
  const changedFields = ['media']

  if (target.role === 'featured' && target.article) {
    const before = target.article
    const patch: ArticlePatch = { featuredImage: url, updatedAt: deps.now() }
    if (target.alt !== null) patch.imageAlt = target.alt
    if (target.caption !== null) patch.imageCaption = target.caption
    const ok = await deps.store.updateArticle(before.id, patch, { status: before.status, updatedAt: before.updatedAt })
    if (!ok) throw new NewsroomError('VERSION_CONFLICT', 'Article changed since it was read; re-read and retry')
    const after = await getArticleOr404(deps.store, before.id)
    if (before.status === 'published') {
      try { deps.onPublicChange(after.categorySlug, after.slug) } catch { /* cache only */ }
    }
    data.article = toArticle(after)
    changedFields.push('featuredImage', ...(target.alt !== null ? ['imageAlt'] : []), ...(target.caption !== null ? ['imageCaption'] : []))
  }
  return { data, articleId: target.article?.id ?? null, changedFields }
}

/** POST /media — direct base64 upload (≤ 4 MB decoded). */
export async function uploadMedia(deps: MediaDeps, actor: Actor, raw: unknown): Promise<MediaWriteResult> {
  requireRole(actor, 'contributor')
  const input = asObject(raw)
  const fields: Fields = {}
  const contentType = typeof input.contentType === 'string' ? input.contentType.trim().toLowerCase() : ''
  if (!isAllowedContentType(contentType)) fields.contentType = 'unsupported content type'
  if (typeof input.filename !== 'string' || !input.filename.trim() || input.filename.length > 255) {
    fields.filename = 'is required (max 255 characters)'
  }
  if (Object.keys(fields).length) fail(fields)
  const buf = decodeBase64(input.dataBase64, MAX_DIRECT_UPLOAD_BYTES)
  const target = await resolveTarget(deps, actor, input, fields)
  if (target.role === 'featured' && !isImageType(contentType)) fail({ contentType: 'featured media must be an image' })
  const storage = requireStorage(deps)

  let prepared: Prepared
  if (isImageType(contentType)) {
    prepared = await prepareImage(buf)
  } else {
    if (!sniffMatches(contentType, buf)) fail({ dataBase64: 'content does not match contentType' })
    prepared = { body: buf, contentType, ext: OTHER_TYPES[contentType], width: null, height: null }
  }

  const key = `newsroom/${randomUUID()}.${prepared.ext}`
  await storage.put(key, prepared.body, prepared.contentType)
  return recordAndAttach(deps, target, key, storage.publicUrl(key), {
    contentType: prepared.contentType, width: prepared.width, height: prepared.height, sizeBytes: prepared.body.length,
  })
}

export interface PresignDto {
  key: string
  uploadUrl: string
  publicUrl: string
  expiresAt: string
  headers: Record<string, string>
}

/** POST /media/presign — presigned R2 PUT (15 min) for large files. Stored as-is (no WebP conversion). */
export async function presignMedia(deps: MediaDeps, actor: Actor, raw: unknown): Promise<PresignDto> {
  requireRole(actor, 'contributor')
  const input = asObject(raw)
  const fields: Fields = {}
  const contentType = typeof input.contentType === 'string' ? input.contentType.trim().toLowerCase() : ''
  if (!isAllowedContentType(contentType)) fields.contentType = 'unsupported content type'
  if (typeof input.filename !== 'string' || !input.filename.trim() || input.filename.length > 255) {
    fields.filename = 'is required (max 255 characters)'
  }
  const size = input.sizeBytes
  if (typeof size !== 'number' || !Number.isSafeInteger(size) || size <= 0) fields.sizeBytes = 'must be a positive integer'
  else if (size > MAX_PRESIGNED_UPLOAD_BYTES) fields.sizeBytes = `must be at most ${MAX_PRESIGNED_UPLOAD_BYTES} bytes`
  if (Object.keys(fields).length) fail(fields)
  const storage = requireStorage(deps)

  const key = `newsroom/${randomUUID()}.${ALL_TYPES[contentType]}`
  const uploadUrl = await storage.presignPut(key, contentType, PRESIGN_EXPIRES_SECONDS)
  return {
    key,
    uploadUrl,
    publicUrl: storage.publicUrl(key),
    expiresAt: new Date(deps.now().getTime() + PRESIGN_EXPIRES_SECONDS * 1000).toISOString(),
    headers: { 'Content-Type': contentType },
  }
}

const KEY_RE = /^newsroom\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|gif|pdf|mp4|mov|ogg|mp3)$/

/** POST /media/confirm — records a completed presigned upload (verified via HeadObject). */
export async function confirmMedia(deps: MediaDeps, actor: Actor, raw: unknown): Promise<MediaWriteResult> {
  requireRole(actor, 'contributor')
  const input = asObject(raw)
  const fields: Fields = {}
  const key = typeof input.key === 'string' ? input.key : ''
  const m = KEY_RE.exec(key)
  if (!m) fail({ key: 'is not a newsroom upload key' })
  const target = await resolveTarget(deps, actor, input, fields)
  const storage = requireStorage(deps)

  if (await deps.store.mediaKeyExists(key)) throw new NewsroomError('INVALID_STATE', 'This upload was already confirmed')
  const head = await storage.head(key)
  if (!head) throw new NewsroomError('NOT_FOUND', 'Upload not found; PUT the file before confirming')
  const contentType = (head.contentType ?? '').split(';')[0].trim().toLowerCase()
  if (!isAllowedContentType(contentType) || ALL_TYPES[contentType] !== m[1]) {
    fail({ key: 'stored object has an unexpected content type' })
  }
  if (head.sizeBytes <= 0 || head.sizeBytes > MAX_PRESIGNED_UPLOAD_BYTES) fail({ key: 'stored object has an invalid size' })
  if (target.role === 'featured' && !isImageType(contentType)) fail({ role: 'featured media must be an image' })

  return recordAndAttach(deps, target, key, storage.publicUrl(key), {
    contentType, width: null, height: null, sizeBytes: head.sizeBytes,
  })
}
