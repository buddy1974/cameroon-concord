export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server';
import { requireAutomation } from '@/lib/auth/require-automation';

function isClaudeBody(value: unknown): value is { system: string; user: string } {
  if (!value || typeof value !== 'object') return false;
  const body = value as Record<string, unknown>;
  return typeof body.system === 'string' && typeof body.user === 'string';
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAutomation(req);
    if (!auth.ok) return auth.response;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI is not configured' }, { status: 503 });
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [
          { role: 'system', content: body.system },
          { role: 'user',   content: body.user },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `OpenAI error: ${response.status}`, raw: errText }, { status: 500 });
    }

    const aiData = await response.json() as { choices?: { message?: { content?: string } }[] };
    let text = aiData.choices?.[0]?.message?.content || '';
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    // Validate JSON before returning
    try {
      JSON.parse(text);
    } catch {
      console.error('INVALID JSON FROM OPENAI');
      return new NextResponse(JSON.stringify({
        publish: false,
        error: 'INVALID_JSON_FROM_OPENAI',
      }), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-transform, no-store',
        }
      });
    }

    const payload = JSON.stringify({ text });
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
