export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server';
import { requireAutomation } from '@/lib/auth/require-automation';
import { cleanAiJsonText, generateAiText } from '@/lib/ai/providers';
import { validateDateRegression } from '@/lib/ai/date-guard';
import { getPromptDateContext } from '@/lib/ai/prompt-date-context';

function isClaudeBody(value: unknown): value is { system: string; user: string } {
  if (!value || typeof value !== 'object') return false;
  const body = value as Record<string, unknown>;
  return typeof body.system === 'string' && typeof body.user === 'string';
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAutomation(req);
    if (!auth.ok) return auth.response;

    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI providers are not configured' }, { status: 503 });
    }

    const rawText = await req.text();
    let body: unknown;
    try {
      body = JSON.parse(rawText);
      if (typeof body === 'string') body = JSON.parse(body);
    } catch(e: unknown) {
      const message = e instanceof Error ? e.message : 'Invalid JSON';
      return NextResponse.json({ error: 'Body parse failed: ' + message, raw: rawText.substring(0, 200) }, { status: 400 });
    }

    if (!isClaudeBody(body)) {
      const received = body && typeof body === 'object' ? Object.keys(body) : [];
      return NextResponse.json({ error: 'Missing system or user field', received }, { status: 400 });
    }
    const dateContext = getPromptDateContext();
    const safetySystem = `${dateContext.promptBlock}

WORLD CUP FACT GUARD
Cameroon did not qualify for the 2026 World Cup finals.
Do not claim Cameroon is participating.
Cameroon coverage must be framed as absence/accountability/FECAFOOT/diaspora unless a verified source says otherwise.
Do not invent African team counts.
Do not call a team "qualified" unless the source confirms it.
If unsure, say "World Cup-related" or "qualification/absence story."

Automation output must be draft-safe only. Do not instruct direct publishing of incomplete or failed AI content.`;

    const ai = await generateAiText({
      messages: [
        { role: 'system', content: safetySystem },
        { role: 'system', content: body.system },
        { role: 'user',   content: body.user },
      ],
      openAiModel: 'gpt-4o',
      maxTokens: 2000,
      timeoutMs: 45_000,
    });

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
      });
    }

    const text = cleanAiJsonText(ai.text);
    const dateGuard = validateDateRegression(body.user, text);
    if (!dateGuard.ok) {
      return NextResponse.json({
        publish: false,
        status: 'provider_error',
        provider: ai.provider,
        error_type: 'date_regression',
        retry_count: ai.retryCount,
        error: dateGuard.error,
      });
    }

    // Validate JSON before returning
    try {
      JSON.parse(text);
    } catch {
      console.info('[ai-provider]', { provider: 'failed', errorType: 'malformed_response' });
      return new NextResponse(JSON.stringify({
        publish: false,
        status: 'provider_error',
        provider: 'failed',
        error_type: 'malformed_response',
        retry_count: ai.retryCount,
        error: 'INVALID_JSON_FROM_AI_PROVIDER',
      }), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-transform, no-store',
        }
      });
    }

    const payload = JSON.stringify({
      text,
      publish: false,
      status: 'draft_ready',
      provider: ai.provider,
      retry_count: ai.retryCount,
      fallback_used: ai.fallbackUsed,
      notice: ai.fallbackUsed ? 'OpenAI was rate-limited, but Claude fallback completed the enhancement.' : undefined,
    });
    return new NextResponse(payload, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(Buffer.byteLength(payload, 'utf8')),
        'Cache-Control': 'no-transform, no-store, no-cache',
        'X-Content-Type-Options': 'nosniff',
      }
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
