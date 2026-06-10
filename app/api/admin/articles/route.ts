import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { articles, categories, authors, articleHits } from '@/lib/db/schema'
import { desc, eq, like, sql, and } from 'drizzle-orm'
import { postArticleToSocial } from '@/server/lib/social'
import { sanitizeArticleBody } from '@/lib/sanitize'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/require-admin'
import { requireAutomation } from '@/lib/auth/require-automation'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(req.url)
  const page    = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit   = 20
  const offset  = (page - 1) * limit
  const search  = searchParams.get('q') || ''
  const catSlug = searchParams.get('category') || ''
  const status  = searchParams.get('status') || ''

  const conditions = [
    search  ? like(articles.title, `%${search}%`)                                    : undefined,
    catSlug ? eq(categories.slug, catSlug)                                            : undefined,
    status  ? eq(articles.status, status as 'draft' | 'published' | 'archived')      : undefined,
  ].filter(Boolean) as Parameters<typeof and>

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const rows = await db
    .select({
      id:          articles.id,
      title:       articles.title,
      slug:        articles.slug,
      status:      articles.status,
      publishedAt: articles.publishedAt,
      category:    categories.name,
      catSlug:     categories.slug,
      hits:        articleHits.hits,
      isBreaking:  articles.isBreaking,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(authors, eq(articles.authorId, authors.id))
    .leftJoin(articleHits, eq(articleHits.articleId, articles.id))
    .where(where)
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .offset(offset)

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .where(where)

  return NextResponse.json({ articles: rows, total: Number(count), page, limit })
}

export async function POST(req: NextRequest) {
  // Auth: API key (n8n / automation) or JWT cookie (admin UI)
  if (req.headers.get('x-api-key')) {
    const automation = requireAutomation(req)
    if (!automation.ok) return automation.response
  } else {
    const auth = await requireAdmin()
    if (!auth.ok) {
      return auth.response
    }
  }

  const body = await req.json() as {
    title: string; slug: string; body: string; excerpt?: string
    categoryId: number; featuredImage?: string; status: string
    metaTitle?: string; metaDesc?: string; isBreaking?: boolean; isFeatured?: boolean
    authorId?: number | null; summary?: string[] | null
    imageAlt?: string | null; imageCaption?: string | null; canonicalUrl?: string | null
    countryTags?: string[] | null; isLive?: number | boolean | null
  }

  const validCats = await db.select({ id: categories.id }).from(categories)
  const validCategoryIds = validCats.map(c => c.id)
  if (!validCategoryIds.includes(Number(body.categoryId))) {
    body.categoryId = 9;
  }

  // Block low-quality or non-embeddable image sources
  const BLOCKED_IMAGE_HOSTS = [
    'fbcdn.net',
    'scontent.',
    'encrypted-tbn0.gstatic.com',
    'gstatic.com',
    'images.euronews.com',
    'euronews.com',
  ]
  const isBadImage = (url?: string) =>
    !!url && BLOCKED_IMAGE_HOSTS.some(h => url.includes(h))
  if (isBadImage(body.featuredImage)) body.featuredImage = undefined

  const now = new Date()
  let newId: number
  try {
    const result = await db.insert(articles).values({
      title:         body.title,
      slug:          body.slug,
      body:          sanitizeArticleBody(body.body || ''),
      excerpt:       body.excerpt || null,
      categoryId:    body.categoryId,
      featuredImage: body.featuredImage || null,
      imageAlt:      body.imageAlt || null,
      imageCaption:  body.imageCaption || null,
      status:        body.status as 'draft' | 'published',
      isBreaking:    body.isBreaking || false,
      isFeatured:    body.isFeatured || false,
      isLive:        body.isLive ? 1 : 0,
      metaTitle:     body.metaTitle || null,
      metaDesc:      body.metaDesc || null,
      canonicalUrl:  body.canonicalUrl || null,
      authorId:      body.authorId || null,
      summary:       body.summary || null,
      countryTags:   body.countryTags || null,
      publishedAt:   body.status === 'published' ? now : null,
      createdAt:     now,
      updatedAt:     now,
    }).$returningId()
    newId = result[0].id
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/admin/articles] DB insert failed:', msg)
    if (msg.includes('Duplicate entry')) {
      return NextResponse.json({ error: 'Duplicate slug', detail: msg }, { status: 422 })
    }
    return NextResponse.json({ error: 'DB insert failed', detail: msg }, { status: 500 })
  }

  revalidatePath('/', 'layout')

  // Fire-and-forget social post for published articles
  if (body.status === 'published') {
    const cat = await db.select({ slug: categories.slug, name: categories.name })
      .from(categories).where(eq(categories.id, body.categoryId)).limit(1)
    if (cat[0]) {
      postArticleToSocial({
        id:            newId,
        title:         body.title,
        slug:          body.slug,
        excerpt:       body.excerpt,
        featuredImage: body.featuredImage,
        category:      cat[0],
      }).catch(console.error)
    }
  }

  return NextResponse.json({ ok: true, id: newId })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const confirm = searchParams.get('confirm')

  if (status !== 'draft' || confirm !== 'delete-drafts') {
    return NextResponse.json(
      { error: 'Bulk delete is only allowed for drafts with confirmation.' },
      { status: 400 }
    )
  }

  await db.delete(articles).where(eq(articles.status, 'draft'))

  revalidatePath('/', 'layout')
  revalidatePath('/admin/articles')

  return NextResponse.json({ ok: true })
}
