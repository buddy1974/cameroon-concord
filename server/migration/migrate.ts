import mysql from 'mysql2/promise'
import * as dotenv from 'dotenv'
import { load as cheerioLoad } from 'cheerio'
import slugifyLib from 'slugify'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

const SOURCE: mysql.ConnectionOptions = {
  host:     process.env.MIGRATION_SRC_HOST     || '127.0.0.1',
  port:     Number(process.env.MIGRATION_SRC_PORT) || 3306,
  user:     process.env.MIGRATION_SRC_USER     || 'root',
  password: process.env.MIGRATION_SRC_PASSWORD || '',
  database: process.env.MIGRATION_SRC_DB       || 'ccbackup',
}

const DEST: mysql.ConnectionOptions = {
  host:     process.env.DB_HOST!,
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  ssl:      { rejectUnauthorized: false },
}

const PREFIX    = 'news_'
const BATCH     = 100
const LOG_FILE  = path.join(process.cwd(), 'server/migration/migration.log')

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(line)
  fs.appendFileSync(LOG_FILE, line + '\n')
}

function slugify(text: string): string {
  return slugifyLib(text, { lower: true, strict: true, trim: true })
}

function cleanHtml(html: string): string {
  if (!html) return ''
  const $ = cheerioLoad(html)
  $('img').each((_, el) => {
    const src = $(el).attr('src') || ''
    if (src.startsWith('/images/') || src.startsWith('images/')) {
      const abs = src.startsWith('/') ? src : '/' + src
      $(el).attr('src', `https://www.cameroon-concord.com${abs}`)
    }
  })
  $('p').each((_, el) => {
    if ($(el).text().trim() === '' && $(el).children().length === 0) $(el).remove()
  })
  return $('body').html() || ''
}

function excerpt(html: string, max = 160): string {
  const $ = cheerioLoad(html)
  const t = $.text().replace(/\s+/g, ' ').trim()
  return t.length > max ? t.substring(0, max) + '…' : t
}

async function migrateCategories(src: mysql.Connection, dst: mysql.Connection) {
  log('── Categories...')
  const [rows] = await src.execute<mysql.RowDataPacket[]>(`
    SELECT id, alias, title, parent_id, description
    FROM \`${PREFIX}categories\`
    WHERE extension='com_content' AND published=1 AND level>0
    ORDER BY level ASC, id ASC
  `)
  for (const r of rows) {
    const slug = (r.alias || slugify(r.title) || `cat-${r.id}`).substring(0, 120)
    await dst.execute(`
      INSERT IGNORE INTO categories (legacy_id, slug, name, parent_id, description)
      VALUES (?,?,?,?,?)
    `, [r.id, slug, r.title.substring(0,120), r.parent_id > 1 ? r.parent_id : null, r.description || null])
  }
  log(`   ✓ ${rows.length} categories`)
}

async function migrateAuthors(_src: mysql.Connection, _dst: mysql.Connection) {
  log('── Authors... skipped (news_users not in backup)')
  await _dst.execute(`
    INSERT IGNORE INTO authors (slug, name, email, is_ai)
    VALUES ('news-team', 'News Team', 'admin@cameroon-concord.com', 0)
  `)
  log('   ✓ Default author "News Team" created')
}

async function migrateArticles(src: mysql.Connection, dst: mysql.Connection) {
  log('── Articles...')
  const [[{ cnt }]] = await src.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) as cnt FROM \`${PREFIX}content\` WHERE state=1`
  )
  log(`   Total: ${cnt}`)

  let offset = 0, migrated = 0, failed = 0
  const failures: unknown[] = []

  while (offset < (cnt as number)) {
    const [rows] = await src.execute<mysql.RowDataPacket[]>(`
      SELECT c.id, c.alias, c.title, c.introtext, c.fulltext AS body_extra,
             c.hits, c.created, c.publish_up, c.catid, c.created_by,
             c.metadesc, c.images
      FROM \`${PREFIX}content\` c
      WHERE c.state=1
      ORDER BY c.id ASC
      LIMIT ${BATCH} OFFSET ${offset}
    `)

    for (const r of rows as mysql.RowDataPacket[]) {
      try {
        const body   = cleanHtml((r.introtext || '') + (r.body_extra || ''))
        const exc    = excerpt(body)
        const slug   = (r.alias as string || slugify(r.title as string) || `article-${r.id}`).substring(0,240).toLowerCase()

        let img: string | null = null
        try {
          const imgData = JSON.parse(r.images as string || '{}')
          img = imgData.image_intro || imgData.image_fulltext || null
          if (img && !img.startsWith('http')) img = `https://www.cameroon-concord.com/${img.replace(/^\//,'')}`
        } catch { img = null }

        const pubAt = (r.publish_up && r.publish_up !== '0000-00-00 00:00:00')
          ? new Date(r.publish_up as string).toISOString().slice(0,19).replace('T',' ')
          : new Date(r.created as string).toISOString().slice(0,19).replace('T',' ')

        const [catRow] = await dst.execute<mysql.RowDataPacket[]>(
          `SELECT id FROM categories WHERE legacy_id=? LIMIT 1`, [r.catid]
        )
        const catId = catRow[0]?.id ?? 1

        const [defaultAuthor] = await dst.execute<mysql.RowDataPacket[]>(
          `SELECT id FROM authors WHERE slug='news-team' LIMIT 1`
        )
        const authorId: number | null = defaultAuthor[0]?.id ?? null

        await dst.execute(`
          INSERT IGNORE INTO articles
            (legacy_id, slug, title, body, excerpt, category_id, author_id,
             featured_image, status, is_breaking, is_featured, published_at,
             created_at, legacy_hits, ai_generated, ai_reviewed, lang,
             meta_desc, legacy_url)
          VALUES (?,?,?,?,?,?,?,?,'published',0,0,?,?,?,0,0,'en',?,?)
        `, [
          r.id, slug, (r.title as string).substring(0,320),
          body || '<p></p>', exc.substring(0,500),
          catId, authorId, img, pubAt,
          new Date(r.created as string).toISOString().slice(0,19).replace('T',' '),
          r.hits || 0,
          exc.substring(0,320),
          `/en/article/${slug}`,
        ])

        if ((r.hits as number) > 0) {
          await dst.execute(`
            INSERT IGNORE INTO article_hits (article_id, hits)
            SELECT id, ? FROM articles WHERE legacy_id=? LIMIT 1
          `, [r.hits, r.id])
        }

        migrated++
      } catch (err) {
        failed++
        failures.push({ id: r.id, error: String(err) })
      }
    }

    offset += BATCH
    log(`   Progress: ${Math.min(offset, cnt as number)}/${cnt} — ok:${migrated} fail:${failed}`)
  }

  if (failures.length > 0) {
    fs.writeFileSync(
      path.join(process.cwd(), 'server/migration/failed.json'),
      JSON.stringify(failures, null, 2)
    )
  }
  log(`   ✓ ${migrated} articles migrated, ${failed} failed`)
}

async function migrateTags(_src: mysql.Connection, _dst: mysql.Connection) {
  log('── Tags... skipped (news_tags not in backup)')
}

async function migrateArticleTags(_src: mysql.Connection, _dst: mysql.Connection) {
  log('── Article tags... skipped (news_contentitem_tag_map not in backup)')
}

async function buildRedirects(src: mysql.Connection, dst: mysql.Connection) {
  log('── Redirects...')
  const [rows] = await src.execute<mysql.RowDataPacket[]>(`
    SELECT c.alias AS aslug, cat.alias AS cslug
    FROM \`${PREFIX}content\` c
    INNER JOIN \`${PREFIX}categories\` cat ON cat.id=c.catid
    WHERE c.state=1
  `)
  let count = 0
  for (const r of rows as mysql.RowDataPacket[]) {
    const to = `/${r.cslug}/${r.aslug}`
    try {
      await dst.execute(
        `INSERT IGNORE INTO redirects (from_path, to_path, status_code) VALUES (?,?,301)`,
        [`/en/${r.cslug}/${r.aslug}`, to]
      )
      await dst.execute(
        `INSERT IGNORE INTO redirects (from_path, to_path, status_code) VALUES (?,?,301)`,
        [`/en/category-blog-layout-02/${r.aslug}`, to]
      )
      count += 2
    } catch { /* skip dupes */ }
  }
  log(`   ✓ ${count} redirects`)
}

async function main() {
  fs.writeFileSync(LOG_FILE, '')
  log('═══ CONCORD MIGRATION START ═══')
  let src: mysql.Connection | null = null
  let dst: mysql.Connection | null = null
  try {
    src = await mysql.createConnection(SOURCE)
    log('✓ Source DB connected')
    dst = await mysql.createConnection(DEST)
    log('✓ Destination DB connected')

    await migrateCategories(src, dst)
    await migrateAuthors(src, dst)
    await migrateArticles(src, dst)
    await migrateTags(src, dst)
    await migrateArticleTags(src, dst)
    await buildRedirects(src, dst)

    log('═══ MIGRATION COMPLETE ═══')
  } catch (err) {
    log(`FATAL: ${String(err)}`)
    process.exit(1)
  } finally {
    await src?.end()
    await dst?.end()
  }
}

main()
