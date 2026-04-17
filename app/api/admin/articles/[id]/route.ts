import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { articles, categories } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { postArticleToSocial } from '@/server/lib/social'
import { sanitizeArticleBody } from '@/lib/sanitize'

export const dynamic = 'force-dynamic'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const rows = await db.select().from(articles).where(eq(articles.id, parseInt(id))).limit(1)
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }  = await params
  const articleId = parseInt(id)
  const body = await req.json() as Partial<typeof articles.$inferInsert>
  console.log('PUBLISH DB WRITE', { id, status: body.status, categoryId: body.categoryId })

  const validCats = await db.select({ id: categories.id }).from(categories);
  const validCatIds = validCats.map(c => c.id);
  if (body.categoryId && !validCatIds.includes(Number(body.categoryId))) {
    body.categoryId = validCatIds[0] || 7;
  }

  const updateData = { ...body, updatedAt: new Date() };
  if (updateData.body) updateData.body = sanitizeArticleBody(updateData.body)
  if (body.status === 'published') {
    updateData.publishedAt = updateData.publishedAt || new Date();
  }
  const [existing] = await db
    .select({ status: articles.status })
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1)
  const wasAlreadyPublished = existing?.status === 'published'

  await db.update(articles)
    .set(updateData)
    .where(eq(articles.id, articleId))

  // Fire-and-forget social post only on first-time publish transition
  console.log('SOCIAL TRIGGER CHECK', { status: body.status, title: !!body.title, slug: !!body.slug, categoryId: body.categoryId })
  if (body.status === 'published' && !wasAlreadyPublished && body.title && body.slug && body.categoryId) {
    const cat = await db.select({ slug: categories.slug, name: categories.name })
      .from(categories).where(eq(categories.id, body.categoryId)).limit(1)
    if (cat[0]) {
      postArticleToSocial({
        id:            articleId,
        title:         body.title,
        slug:          body.slug,
        excerpt:       body.excerpt,
        featuredImage: body.featuredImage,
        category:      cat[0],
      }).catch(console.error)
    }
  }

  revalidatePath('/')
  revalidatePath('/[category]', 'layout')
  revalidatePath('/[category]/[slug]', 'page')

  // Ping Facebook to re-scrape og:image
  if (body.status === 'published' && body.slug && body.categoryId) {
    const catRes = await db.select({ slug: categories.slug })
      .from(categories).where(eq(categories.id, body.categoryId)).limit(1);
    if (catRes[0]) {
      const articleUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/${catRes[0].slug}/${body.slug}`;
      fetch(`https://graph.facebook.com/?id=${encodeURIComponent(articleUrl)}&scrape=true`, {
        method: 'POST'
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.delete(articles).where(eq(articles.id, parseInt(id)))
  return NextResponse.json({ ok: true })
}
