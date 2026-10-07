/**
 * Cloudflare R2 implementation of MediaStorage (same bucket/credentials as the CMS upload).
 * Returns null when R2 is not configured — callers answer 503 API_NOT_CONFIGURED.
 */
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { MediaStorage } from './media'

export function createR2Storage(): MediaStorage | null {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } = process.env
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL) return null

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  })
  const bucket = R2_BUCKET
  const base = R2_PUBLIC_URL.replace(/\/+$/, '')

  return {
    async put(key, body, contentType) {
      await s3.send(new PutObjectCommand({
        Bucket: bucket, Key: key, Body: body, ContentType: contentType,
        CacheControl: 'public, max-age=31536000',
      }))
    },
    async head(key) {
      try {
        const res = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
        return { contentType: res.ContentType ?? null, sizeBytes: Number(res.ContentLength ?? 0) }
      } catch (err) {
        const status = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode
        if (status === 404 || (err as { name?: string })?.name === 'NotFound') return null
        throw err
      }
    },
    async presignPut(key, contentType, expiresInSeconds) {
      return getSignedUrl(
        s3,
        // Only Content-Type is bound; the client sends exactly the headers /presign returns.
        new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
        { expiresIn: expiresInSeconds },
      )
    },
    publicUrl(key) {
      return `${base}/${key}`
    },
  }
}
