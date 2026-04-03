import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  const { title, body, type } = await req.json() as {
    title: string; body: string; type: 'meta' | 'excerpt' | 'full'
  }

  const prompt = type === 'meta'
    ? `Generate SEO meta_title (max 60 chars) and meta_desc (max 155 chars) for this Cameroon news article.
Title: ${title}
Body: ${body.slice(0, 500)}
Return JSON only: {"meta_title":"...","meta_desc":"..."}`

    : type === 'excerpt'
    ? `Write a compelling 1-2 sentence news excerpt (max 200 chars) for this article.
Title: ${title}
Body: ${body.slice(0, 800)}
Return JSON only: {"excerpt":"..."}`

    : `Generate meta_title, meta_desc, and excerpt for this article.
Title: ${title}
Body: ${body.slice(0, 800)}
Return JSON only: {"meta_title":"...","meta_desc":"...","excerpt":"..."}`

  const message = await claude.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 300,
    messages:   [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return NextResponse.json(JSON.parse(clean))
  } catch {
    return NextResponse.json({ error: 'Parse failed', raw: text }, { status: 500 })
  }
}
