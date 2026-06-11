import { NextRequest, NextResponse } from 'next/server'
import { generateAiText } from '@/lib/ai/providers'

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

  const ai = await generateAiText({
    messages: [
      ...(system ? [{ role: 'system' as const, content: system }] : []),
      { role: 'user', content: promptText },
    ],
    openAiModel: 'gpt-4o-mini',
    maxTokens: 4000,
    timeoutMs: 45_000,
  })

  if (!ai.ok) {
    return NextResponse.json({
      publish: false,
      status: ai.errorType === 'rate_limit' || ai.errorType === 'quota_limit' ? 'retry_pending' : 'provider_error',
      provider: 'failed',
      error_type: ai.errorType,
      retry_count: ai.retryCount,
      fallback_attempted: ai.fallbackAttempted,
      error: 'AI providers are currently unavailable. Draft was not published.',
    })
  }

  return NextResponse.json({
    status: 'ok',
    provider: ai.provider,
    retry_count: ai.retryCount,
    fallback_used: ai.fallbackUsed,
    notice: ai.fallbackUsed ? 'OpenAI was rate-limited, but Claude fallback completed the enhancement.' : undefined,
    content: [{ type: 'text', text: ai.text }],
  })
}
