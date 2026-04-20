import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { articles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import Anthropic from '@anthropic-ai/sdk'

const claude = new Anthropic()

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

  const clean = article.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000)

  const message = await claude.messages.create({
    model: 'claude-sonnet-4-6',
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
  })

  const raw = (message.content[0] as { text: string }).text.trim()
  let perspectives: { regime: string; opposition: string; independent: string }
  try {
    perspectives = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Parse failed' }, { status: 500 })
  }

  await db.update(articles).set({ perspectives }).where(eq(articles.id, articleId))

  return NextResponse.json(perspectives)
}
