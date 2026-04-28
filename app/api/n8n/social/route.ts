export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { articles, categories } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { postArticleToSocial } from '@/server/lib/social'

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== process.env.NEXT_PUBLIC_AUTOMATION_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json() as { articleId?: number; platform?: string }
    const { articleId, platform } = body

    if (!articleId) {
      return NextResponse.json({ error: 'articleId required' }, { status: 400 })
    }

    const [article] = await db
      .select({
        id:              articles.id,
        title:           articles.title,
        slug:            articles.slug,
        excerpt:         articles.excerpt,
        featuredImage:   articles.featuredImage,
        status:          articles.status,
        twitterPostedAt: articles.twitterPostedAt,
        fbPostedAt:      articles.fbPostedAt,
        category:        { name: categories.name, slug: categories.slug },
      })
      .from(articles)
      .innerJoin(categories, eq(articles.categoryId, categories.id))
      .where(eq(articles.id, articleId))
      .limit(1)

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    if (article.status !== 'published') {
      return NextResponse.json({ error: 'Article not published' }, { status: 422 })
    }

    if (platform === 'twitter' && article.twitterPostedAt) {
      return NextResponse.json({ error: 'Already posted to Twitter' }, { status: 409 })
    }

    await postArticleToSocial({
      id:            article.id,
      title:         article.title,
      slug:          article.slug,
      excerpt:       article.excerpt,
      featuredImage: article.featuredImage,
      category:      article.category,
    })

    await db
      .update(articles)
      .set({ twitterPostedAt: new Date() })
      .where(eq(articles.id, articleId))

    return NextResponse.json({ ok: true, articleId, platform })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/n8n/social]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
