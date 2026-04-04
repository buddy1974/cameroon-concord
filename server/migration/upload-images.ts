import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import mysql from 'mysql2/promise'

dotenv.config({ path: '.env.local' })

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET   = process.env.R2_BUCKET!
const CDN_URL  = process.env.R2_PUBLIC_URL!
const IMG_DIR  = path.join(process.cwd(), 'public', 'images')
const LOG_FILE = path.join(process.cwd(), 'server/migration/r2-upload.log')

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(line)
  fs.appendFileSync(LOG_FILE, line + '\n')
}

function getMime(ext: string): string {
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', gif: 'image/gif',
    webp: 'image/webp', svg: 'image/svg+xml',
    mp4: 'video/mp4', pdf: 'application/pdf',
  }
  return map[ext.toLowerCase()] || 'application/octet-stream'
}

async function exists(key: string): Promise<boolean> {
  try {
    await R2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch { return false }
}

function getAllFiles(dir: string, base = ''): string[] {
  const files: string[] = []
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      files.push(...getAllFiles(path.join(dir, entry.name), rel))
    } else {
      files.push(rel)
    }
  }
  return files
}

async function uploadImages() {
  fs.writeFileSync(LOG_FILE, '')
  log('═══ R2 IMAGE UPLOAD START ═══')

  const files = getAllFiles(IMG_DIR)
  log(`Found ${files.length} files in public/images/`)

  let uploaded = 0, skipped = 0, failed = 0

  for (let i = 0; i < files.length; i++) {
    const rel = files[i]
    const key = `images/${rel.replace(/\\/g, '/')}`
    const localPath = path.join(IMG_DIR, rel)
    const ext = path.extname(rel).replace('.', '')

    try {
      const already = await exists(key)
      if (already) { skipped++; continue }

      const body = fs.readFileSync(localPath)
      await R2.send(new PutObjectCommand({
        Bucket:       BUCKET,
        Key:          key,
        Body:         body,
        ContentType:  getMime(ext),
        CacheControl: 'public, max-age=31536000',
      }))
      uploaded++
      if (uploaded % 50 === 0) {
        log(`Progress: ${i + 1}/${files.length} — uploaded:${uploaded} skipped:${skipped} failed:${failed}`)
      }
    } catch (err) {
      failed++
      log(`FAILED: ${key} — ${String(err)}`)
    }
  }

  log(`Upload done — uploaded:${uploaded} skipped:${skipped} failed:${failed}`)
}

async function updateDbUrls() {
  log('═══ UPDATING DB IMAGE URLS ═══')

  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST!,
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    ssl:      { rejectUnauthorized: false },
  })

  const queries = [
    `UPDATE articles SET featured_image = REPLACE(featured_image,'https://www.cameroon-concord.com/images/','${CDN_URL}/images/') WHERE featured_image LIKE '%www.cameroon-concord.com/images/%'`,
    `UPDATE articles SET featured_image = REPLACE(featured_image,'http://www.cameroon-concord.com/images/','${CDN_URL}/images/') WHERE featured_image LIKE '%http://www.cameroon-concord.com/images/%'`,
    `UPDATE articles SET featured_image = REPLACE(featured_image,'https://cameroon-concord.com/images/','${CDN_URL}/images/') WHERE featured_image LIKE '%cameroon-concord.com/images/%'`,
    `UPDATE articles SET body = REPLACE(body,'src="https://www.cameroon-concord.com/images/','src="${CDN_URL}/images/') WHERE body LIKE '%src="https://www.cameroon-concord.com/images/%'`,
    `UPDATE articles SET body = REPLACE(body,'src="/images/','src="${CDN_URL}/images/') WHERE body LIKE '%src="/images/%'`,
  ]

  for (const q of queries) {
    const [r] = await conn.execute(q) as any
    log(`Updated ${r.affectedRows} rows`)
  }

  await conn.end()
  log('DB update complete')
}

async function main() {
  await uploadImages()
  await updateDbUrls()
  log('═══ MIGRATION COMPLETE ═══')
}

main().catch(err => {
  log(`FATAL: ${String(err)}`)
  process.exit(1)
})
