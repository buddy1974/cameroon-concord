import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { articles, categories, authors } from '@/lib/db/schema'
import { desc, eq, like, sql, and } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { postArticleToSocial } from '@/server/lib/social'
import { sanitizeArticleBody } from '@/lib/sanitize'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
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
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(authors, eq(articles.authorId, authors.id))
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
  const apiKey = req.headers.get('x-api-key')
  if (apiKey && apiKey === process.env.NEXT_PUBLIC_AUTOMATION_API_KEY) {
    // authenticated via API key — continue
  } else {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value
    const admin = token ? await verifyToken(token) : null
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as {
    title: string; slug: string; body: string; excerpt?: string
    categoryId: number; featuredImage?: string; status: string
    metaTitle?: string; metaDesc?: string; isBreaking?: boolean; isFeatured?: boolean
  }

  const validCategoryIds = [1,2,3,4,5,6,7,8];
  if (!validCategoryIds.includes(Number(body.categoryId))) {
    body.categoryId = 7;
  }

  // Block low-quality or non-embeddable image sources
  const BLOCKED_IMAGE_HOSTS = [
    'fbcdn.net',
    'scontent.',
    'encrypted-tbn0.gstatic.com',
    'gstatic.com',
  ]
  const isBadImage = (url?: string) =>
    !!url && BLOCKED_IMAGE_HOSTS.some(h => url.includes(h))
  if (isBadImage(body.featuredImage)) body.featuredImage = undefined

  const now = new Date()
  const result = await db.insert(articles).values({
    title:         body.title,
    slug:          body.slug,
    body:          sanitizeArticleBody(body.body || ''),
    excerpt:       body.excerpt || null,
    categoryId:    body.categoryId,
    featuredImage: body.featuredImage || null,
    status:        body.status as 'draft' | 'published',
    isBreaking:    body.isBreaking || false,
    isFeatured:    body.isFeatured || false,
    metaTitle:     body.metaTitle || null,
    metaDesc:      body.metaDesc || null,
    publishedAt:   body.status === 'published' ? now : null,
    createdAt:     now,
    updatedAt:     now,
  }).$returningId()

  const newId = result[0].id

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
