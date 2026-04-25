import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== process.env.NEXT_PUBLIC_AUTOMATION_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { system, prompt, user } = body as { system?: string; prompt?: string; user?: string }
  const promptText = prompt ?? user ?? ''
  if (!promptText) return NextResponse.json({ error: 'prompt or user field required' }, { status: 400 })

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 4000,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: promptText },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    return NextResponse.json({ error }, { status: response.status })
  }

  const data = await response.json() as { choices?: { message?: { content?: string } }[] }
  const text = data.choices?.[0]?.message?.content || ''
  return NextResponse.json({ content: [{ type: 'text', text }] })
}
