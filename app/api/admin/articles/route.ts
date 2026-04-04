import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { articles, categories, authors } from '@/lib/db/schema'
import { desc, eq, like, sql, and } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

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
  console.log('POST /api/admin/articles headers:', {
    apiKey:      req.headers.get('x-api-key') ? 'present' : 'missing',
    cookie:      req.headers.get('cookie')    ? 'present' : 'missing',
    cookieValue: req.headers.get('cookie')?.substring(0, 50),
  })
  // Auth: API key (n8n / automation) or JWT cookie (admin UI)
  const apiKey = req.headers.get('x-api-key')
  if (apiKey && apiKey === process.env.AUTOMATION_API_KEY) {
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

  const now = new Date()
  const result = await db.insert(articles).values({
    title:         body.title,
    slug:          body.slug,
    body:          body.body,
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

  return NextResponse.json({ ok: true, id: result[0].id })
}
