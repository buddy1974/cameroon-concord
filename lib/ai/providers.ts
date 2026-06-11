export type AiProvider = 'openai' | 'anthropic'
export type AiProviderLog = 'openai' | 'anthropic_fallback' | 'failed'
export type AiErrorType =
  | 'rate_limit'
  | 'quota_limit'
  | 'temporary_provider_error'
  | 'quota'
  | 'timeout'
  | 'malformed_response'
  | 'provider_error'
  | 'not_configured'

type AiMessage = {
  role: 'system' | 'user'
  content: string
}

export type GenerateAiTextInput = {
  messages: AiMessage[]
  openAiModel?: string
  anthropicModel?: string
  maxTokens: number
  timeoutMs?: number
  allowFallback?: boolean
}

export type GenerateAiTextResult = {
  ok: true
  text: string
  provider: AiProviderLog
  fallbackUsed: boolean
  retryCount: number
  openAiErrorType?: AiErrorType
} | {
  ok: false
  provider: AiProviderLog
  errorType: AiErrorType
  message: string
  retryCount: number
  fallbackAttempted: boolean
}

class AiProviderError extends Error {
  constructor(
    public provider: AiProvider,
    public errorType: AiErrorType,
    message: string,
    public status?: number,
  ) {
    super(message)
  }
}

const OPENAI_RETRY_DELAYS = [1000, 3000]
const DEFAULT_TIMEOUT_MS = 45_000
const HUGE_PROMPT_CHARS = 60_000

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function configuredPrimary(): AiProvider | null {
  const requested = (process.env.AI_PRIMARY_PROVIDER || 'openai').toLowerCase()
  if (requested === 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (requested === 'openai' && process.env.OPENAI_API_KEY) return 'openai'
  if (process.env.OPENAI_API_KEY) return 'openai'
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  return null
}

function configuredFallback(primary: AiProvider | null): AiProvider | null {
  const requested = (process.env.AI_FALLBACK_PROVIDER || 'anthropic').toLowerCase()
  if (requested === 'anthropic' && primary !== 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (requested === 'openai' && primary !== 'openai' && process.env.OPENAI_API_KEY) return 'openai'
  if (primary !== 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic'
  return null
}

function classifyOpenAiFailure(status: number, raw: string): AiErrorType {
  if (status === 429) {
    const lower = raw.toLowerCase()
    if (lower.includes('quota') || lower.includes('insufficient_quota') || lower.includes('billing')) return 'quota_limit'
    if (lower.includes('rate') || lower.includes('too many requests')) return 'rate_limit'
    return 'temporary_provider_error'
  }
  if (status === 408 || status === 409 || status >= 500) return 'temporary_provider_error'
  return 'provider_error'
}

function isOpenAiFallbackable(error: AiProviderError): boolean {
  const message = error.message.toLowerCase()
  return (
    error.provider === 'openai' &&
    error.errorType !== 'not_configured' &&
    (
      error.status === 429 ||
      (typeof error.status === 'number' && error.status >= 500) ||
      error.errorType === 'rate_limit' ||
      error.errorType === 'quota_limit' ||
      error.errorType === 'temporary_provider_error' ||
      error.errorType === 'timeout' ||
      message.includes('rate limit') ||
      message.includes('quota')
    )
  )
}

function classifyAnthropicFailure(status: number, raw: string): AiErrorType {
  const lower = raw.toLowerCase()
  if (status === 429 && (lower.includes('quota') || lower.includes('billing'))) return 'quota'
  if (status === 429) return 'rate_limit'
  if (status === 408 || status === 409 || status >= 500) return 'temporary_provider_error'
  return 'provider_error'
}

function combinedPromptLength(messages: AiMessage[]) {
  return messages.reduce((total, msg) => total + msg.content.length, 0)
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number, provider: AiProvider) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new AiProviderError(provider, 'timeout', 'AI provider timed out')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

async function callOpenAi(input: GenerateAiTextInput) {
  if (!process.env.OPENAI_API_KEY) {
    throw new AiProviderError('openai', 'not_configured', 'OpenAI is not configured')
  }

  let response: Response
  try {
    response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: input.openAiModel || process.env.OPENAI_MODEL || 'gpt-4o-mini',
        max_tokens: input.maxTokens,
        messages: input.messages,
      }),
    }, input.timeoutMs ?? DEFAULT_TIMEOUT_MS, 'openai')
  } catch (err) {
    if (err instanceof AiProviderError) throw err
    throw new AiProviderError('openai', 'temporary_provider_error', 'OpenAI network error')
  }

  if (!response.ok) {
    const raw = await response.text()
    throw new AiProviderError('openai', classifyOpenAiFailure(response.status, raw), `OpenAI error: ${response.status}`, response.status)
  }

  const data = await response.json() as { choices?: { message?: { content?: string } }[] }
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new AiProviderError('openai', 'malformed_response', 'OpenAI returned an empty response')
  return text
}

function splitAnthropicMessages(messages: AiMessage[]) {
  const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n') || undefined
  const user = messages.filter(m => m.role === 'user').map(m => m.content).join('\n\n')
  return { system, user }
}

async function callAnthropic(input: GenerateAiTextInput) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiProviderError('anthropic', 'not_configured', 'Anthropic is not configured')
  }

  const { system, user } = splitAnthropicMessages(input.messages)
  const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: input.anthropicModel || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: input.maxTokens,
      ...(system ? { system } : {}),
      messages: [{ role: 'user', content: user }],
    }),
  }, input.timeoutMs ?? DEFAULT_TIMEOUT_MS, 'anthropic')

  if (!response.ok) {
    const raw = await response.text()
    throw new AiProviderError('anthropic', classifyAnthropicFailure(response.status, raw), `Anthropic error: ${response.status}`, response.status)
  }

  const data = await response.json() as { content?: { type?: string; text?: string }[] }
  const text = data.content?.find(part => part.type === 'text' && part.text)?.text
  if (!text) throw new AiProviderError('anthropic', 'malformed_response', 'Anthropic returned an empty response')
  return text
}

function logAi(provider: AiProviderLog, errorType?: AiErrorType, retryCount = 0) {
  const loggedErrorType = errorType === 'quota_limit' ? 'quota' : errorType
  console.info('[ai-provider]', { provider, errorType: loggedErrorType, retryCount })
}

function logProviderFlow(fields: {
  primaryProvider: AiProvider | null
  fallbackProvider: AiProvider | null
  openaiErrorType?: AiErrorType
  fallbackAttempted: boolean
  fallbackSuccess: boolean
  finalProvider: AiProviderLog
  retryCount: number
}) {
  console.info('[ai-provider-flow]', {
    primaryProvider: fields.primaryProvider,
    fallbackProvider: fields.fallbackProvider,
    openaiErrorType: fields.openaiErrorType === 'quota_limit' ? 'quota' : fields.openaiErrorType,
    fallbackAttempted: fields.fallbackAttempted,
    fallbackSuccess: fields.fallbackSuccess,
    finalProvider: fields.finalProvider,
    retryCount: fields.retryCount,
  })
}

export async function generateAiText(input: GenerateAiTextInput): Promise<GenerateAiTextResult> {
  const primary = configuredPrimary()
  const fallback = input.allowFallback === false ? null : configuredFallback(primary)
  const canRetryOpenAi = combinedPromptLength(input.messages) <= HUGE_PROMPT_CHARS
  let retryCount = 0
  let openAiErrorType: AiErrorType | undefined

  if (!primary) {
    logAi('failed', 'not_configured')
    return {
      ok: false,
      provider: 'failed',
      errorType: 'not_configured',
      message: 'AI providers are not configured',
      retryCount,
      fallbackAttempted: false,
    }
  }

  try {
    if (primary === 'openai') {
      for (let attempt = 0; ; attempt++) {
        try {
          const text = await callOpenAi(input)
          logAi('openai', undefined, retryCount)
          logProviderFlow({
            primaryProvider: primary,
            fallbackProvider: fallback,
            fallbackAttempted: false,
            fallbackSuccess: false,
            finalProvider: 'openai',
            retryCount,
          })
          return { ok: true, text, provider: 'openai', fallbackUsed: false, retryCount }
        } catch (err) {
          if (!(err instanceof AiProviderError)) throw err
          openAiErrorType = err.errorType
          const shouldRetry = isOpenAiFallbackable(err) && canRetryOpenAi && attempt < OPENAI_RETRY_DELAYS.length
          if (!shouldRetry) throw err
          await sleep(OPENAI_RETRY_DELAYS[attempt])
          retryCount++
        }
      }
    }

    const text = await callAnthropic(input)
    logAi('anthropic_fallback', undefined, retryCount)
    logProviderFlow({
      primaryProvider: primary,
      fallbackProvider: fallback,
      fallbackAttempted: false,
      fallbackSuccess: false,
      finalProvider: 'anthropic_fallback',
      retryCount,
    })
    return { ok: true, text, provider: 'anthropic_fallback', fallbackUsed: false, retryCount }
  } catch (err) {
    const primaryError = err instanceof AiProviderError ? err : new AiProviderError(primary, 'provider_error', 'AI provider failed')
    openAiErrorType = primary === 'openai' ? primaryError.errorType : openAiErrorType

    if (primary === 'openai' && isOpenAiFallbackable(primaryError) && fallback === 'anthropic') {
      try {
        const text = await callAnthropic(input)
        logAi('anthropic_fallback', openAiErrorType, retryCount)
        logProviderFlow({
          primaryProvider: primary,
          fallbackProvider: fallback,
          openaiErrorType: openAiErrorType,
          fallbackAttempted: true,
          fallbackSuccess: true,
          finalProvider: 'anthropic_fallback',
          retryCount,
        })
        return { ok: true, text, provider: 'anthropic_fallback', fallbackUsed: true, retryCount, openAiErrorType }
      } catch (fallbackErr) {
        const fallbackError = fallbackErr instanceof AiProviderError
          ? fallbackErr
          : new AiProviderError('anthropic', 'provider_error', 'Anthropic fallback failed')
        logAi('failed', fallbackError.errorType, retryCount)
        logProviderFlow({
          primaryProvider: primary,
          fallbackProvider: fallback,
          openaiErrorType: openAiErrorType,
          fallbackAttempted: true,
          fallbackSuccess: false,
          finalProvider: 'failed',
          retryCount,
        })
        return {
          ok: false,
          provider: 'failed',
          errorType: fallbackError.errorType,
          message: fallbackError.message,
          retryCount,
          fallbackAttempted: true,
        }
      }
    }

    logAi('failed', primaryError.errorType, retryCount)
    logProviderFlow({
      primaryProvider: primary,
      fallbackProvider: fallback,
      openaiErrorType: openAiErrorType,
      fallbackAttempted: false,
      fallbackSuccess: false,
      finalProvider: 'failed',
      retryCount,
    })
    return {
      ok: false,
      provider: 'failed',
      errorType: primaryError.errorType,
      message: primaryError.message,
      retryCount,
      fallbackAttempted: false,
    }
  }
}

export function cleanAiJsonText(text: string) {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
}
