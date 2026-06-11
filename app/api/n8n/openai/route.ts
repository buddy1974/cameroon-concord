import { NextRequest, NextResponse } from 'next/server'
import { generateAiText } from '@/lib/ai/providers'
import { validateDateRegression } from '@/lib/ai/date-guard'
import { getPromptDateContext } from '@/lib/ai/prompt-date-context'

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
  const dateContext = getPromptDateContext()
  const safetySystem = `${dateContext.promptBlock}

WORLD CUP FACT GUARD
Cameroon did not qualify for the 2026 World Cup finals.
Do not claim Cameroon is participating.
Cameroon coverage must be framed as absence/accountability/FECAFOOT/diaspora unless a verified source says otherwise.
Do not invent African team counts.
Do not call a team "qualified" unless the source confirms it.
If unsure, say "World Cup-related" or "qualification/absence story."

Automation output must be draft-safe only. Do not instruct direct publishing of incomplete or failed AI content.`

  const ai = await generateAiText({
    messages: [
      { role: 'system', content: safetySystem },
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
      error: ai.fallbackAttempted
        ? 'OpenAI is rate-limited and Claude fallback also failed. Your draft is unchanged.'
        : 'AI providers are currently unavailable. Draft was not published.',
    })
  }

  const dateGuard = validateDateRegression(promptText, ai.text)
  if (!dateGuard.ok) {
    return NextResponse.json({
      publish: false,
      status: 'provider_error',
      provider: ai.provider,
      error_type: 'date_regression',
      retry_count: ai.retryCount,
      error: dateGuard.error,
    })
  }

  return NextResponse.json({
    publish: false,
    status: 'draft_ready',
    provider: ai.provider,
    retry_count: ai.retryCount,
    fallback_used: ai.fallbackUsed,
    notice: ai.fallbackUsed ? 'OpenAI was rate-limited, but Claude fallback completed the enhancement.' : undefined,
    content: [{ type: 'text', text: ai.text }],
  })
}
