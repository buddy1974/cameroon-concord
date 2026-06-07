import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { articles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const articleId = parseInt(id)

  const [article] = await db
    .select({ title: articles.title, body: articles.body, perspectives: articles.perspectives })
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1)

  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (article.perspectives) {
    return NextResponse.json(article.perspectives)
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'AI perspectives not configured' }, { status: 503 })
  }

  const clean = article.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are an expert on Cameroonian politics. Given this news article, generate 3 short perspective summaries (2-3 sentences each) representing different viewpoints on this story.

Article title: ${article.title}
Article excerpt: ${clean}

Return a JSON object with exactly these 3 keys:
- regime: How the Biya government and CPDM party-state would frame or spin this story
- opposition: How Cameroonian opposition figures and civil society would interpret this
- independent: A neutral analytical perspective from an independent international observer

Keep each perspective factual, plausible, and distinct. No more than 3 sentences each.
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

  let perspectives: { regime: string; opposition: string; independent: string }
  try {
    perspectives = JSON.parse(raw.replace(/\`\`\`json\n?/gi, '').replace(/\`\`\`\n?/gi, '').trim())
  } catch {
    return NextResponse.json({ error: 'Parse failed' }, { status: 500 })
  }

  await db.update(articles).set({ perspectives }).where(eq(articles.id, articleId))

  return NextResponse.json(perspectives)
}
