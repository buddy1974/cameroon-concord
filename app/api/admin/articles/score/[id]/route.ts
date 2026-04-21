import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { articles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import Anthropic from '@anthropic-ai/sdk'

const claude = new Anthropic()

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const articleId = parseInt(id)

  const [article] = await db
    .select({ title: articles.title, body: articles.body, excerpt: articles.excerpt })
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1)

  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const clean = article.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1500)

  const message = await claude.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 200,
    messages: [{
      role:    'user',
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
  })

  const raw = (message.content[0] as { text: string }).text.trim()
  let parsed: { score: number; reason: string }
  try { parsed = JSON.parse(raw) }
  catch { return NextResponse.json({ error: 'Parse failed' }, { status: 500 }) }

  const score = Math.min(10, Math.max(1, Math.round(parsed.score)))
  await db.update(articles).set({ ccScore: score }).where(eq(articles.id, articleId))

  return NextResponse.json({ score, reason: parsed.reason })
}
