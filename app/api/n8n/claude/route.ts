export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== process.env.NEXT_PUBLIC_AUTOMATION_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawText = await req.text();
    let body: any;
    try {
      body = JSON.parse(rawText);
      if (typeof body === 'string') body = JSON.parse(body);
    } catch(e: any) {
      return NextResponse.json({ error: 'Body parse failed: ' + e.message, raw: rawText.substring(0, 200) }, { status: 400 });
    }
    const { system, user } = body;

    if (!system || !user) {
      return NextResponse.json({ error: 'Missing system or user field', received: Object.keys(body) }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system,
      messages: [{ role: 'user', content: user }]
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    console.log('RAW CLAUDE RESPONSE:', text.substring(0, 500));

    // Validate JSON before returning
    try {
      JSON.parse(text);
    } catch {
      console.error('INVALID JSON FROM CLAUDE:', text.substring(0, 500));
      return new NextResponse(JSON.stringify({
        publish: false,
        error: 'INVALID_JSON_FROM_CLAUDE',
        raw: text.substring(0, 500),
      }), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-transform, no-store',
        }
      });
    }

    return new NextResponse(JSON.stringify({ text }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-transform, no-store',
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}
