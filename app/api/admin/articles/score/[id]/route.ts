import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { articles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/auth/require-admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Article scoring is not configured' }, { status: 503 })
  }

  const { id } = await params
  const articleId = parseInt(id)

  const [article] = await db
    .select({ title: articles.title, body: articles.body, excerpt: articles.excerpt })
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1)

  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const clean = article.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1500)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Score this news article on a scale of 1-10 for editorial quality.

Criteria:
- Sources cited (named people, organisations, documents): 0-3 points
- Original reporting vs pure rewrite: 0-3 points
- Factual specificity (dates, numbers, locations): 0-2 points
- Balanced or analytical perspective: 0-2 points

Article title: ${article.title}
Article excerpt: ${article.excerpt || ''}
Article body: ${clean}

Return ONLY a JSON object: {"score": N, "reason": "one sentence explanation"}
No markdown, no explanation outside the JSON.`,
      }],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    return NextResponse.json({ error: `OpenAI error: ${response.status}`, raw: errText }, { status: 500 })
  }

  const aiData = await response.json() as { choices?: { message?: { content?: string } }[] }
  const raw = (aiData.choices?.[0]?.message?.content || '{}').trim()

  let parsed: { score: number; reason: string }
  try { parsed = JSON.parse(raw) }
  catch { return NextResponse.json({ error: 'Parse failed' }, { status: 500 }) }

  const score = Math.min(10, Math.max(1, Math.round(parsed.score)))
  await db.update(articles).set({ ccScore: score }).where(eq(articles.id, articleId))

  return NextResponse.json({ score, reason: parsed.reason })
}
