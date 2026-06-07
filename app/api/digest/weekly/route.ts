import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { articles, categories } from '@/lib/db/schema'
import { eq, desc, gte, and } from 'drizzle-orm'
import { requireAutomation } from '@/lib/auth/require-automation'

export async function POST(req: NextRequest) {
  const auth = requireAutomation(req)
  if (!auth.ok) return auth.response

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI is not configured' }, { status: 503 })
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const topArticles = await db
    .select({
      id:          articles.id,
      title:       articles.title,
      slug:        articles.slug,
      excerpt:     articles.excerpt,
      publishedAt: articles.publishedAt,
      category:    { name: categories.name, slug: categories.slug },
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .where(
      and(
        eq(articles.status, 'published'),
        gte(articles.publishedAt, sevenDaysAgo)
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(10)

  if (topArticles.length === 0) {
    return NextResponse.json({ error: 'No articles found' }, { status: 404 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  const articleList = topArticles.map((a, i) =>
    `${i + 1}. [${a.category.slug}/${a.slug}] ${a.title} (${a.category.name})\n   ${a.excerpt ?? ''}`
  ).join('\n\n')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are the editor of Cameroon Concord, an independent English-language news platform covering Cameroon and Southern Cameroons with a critical editorial stance toward the Biya regime.

Write a weekly digest article summarising the top stories from this week.

Stories this week:
${articleList}

Return a JSON object with:
- title: "Cameroon This Week: [punchy summary of the week in max 8 words]"
- body: Full HTML digest article. Start with a bold editorial intro paragraph (2-3 sentences capturing the week's theme). Then a numbered list using <ol><li> tags for each story with a 2-sentence summary and a link: <a href="${siteUrl}/[category_slug]/[slug]">[title]</a>. End with a short editorial closing paragraph. Use only <p>, <h2>, <ol>, <li>, <strong>, <a> tags.
- excerpt: One sentence summary of the week, max 160 chars.
- meta_title: SEO title max 60 chars
- meta_desc: SEO description max 155 chars

Return ONLY valid JSON. No markdown.`,
      }],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    return NextResponse.json({ error: `OpenAI error: ${response.status}`, raw: errText }, { status: 500 })
  }

  const aiData = await response.json() as { choices?: { message?: { content?: string } }[] }
  const raw = (aiData.choices?.[0]?.message?.content || '{}').trim()

  let parsed: { title: string; body: string; excerpt: string; meta_title: string; meta_desc: string }
  try {
    parsed = JSON.parse(raw.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim())
  } catch {
    return NextResponse.json({ error: 'Parse failed', raw }, { status: 500 })
  }

  const headlinesCatId = 9
  const publishedAt = new Date()

  await db.insert(articles).values({
    title:       parsed.title,
    slug:        `cameroon-this-week-${publishedAt.toISOString().split('T')[0]}`,
    body:        parsed.body,
    excerpt:     parsed.excerpt,
    metaTitle:   parsed.meta_title,
    metaDesc:    parsed.meta_desc,
    categoryId:  headlinesCatId,
    status:      'published',
    authorId:    1,
    aiGenerated: true,
    publishedAt,
    createdAt:   publishedAt,
    updatedAt:   publishedAt,
  })

  return NextResponse.json({
    ok:           true,
    title:        parsed.title,
    articleCount: topArticles.length,
  })
}
