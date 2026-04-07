import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || !verifyToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { articles, template } = await req.json();

  const titles = articles.map((a: any) => a.title).join('\n- ');
  const prompt = `You are the editor of Cameroon Concord news. Given these article titles:
- ${titles}

Generate for a ${template} newsletter:
1. A compelling email subject line (max 60 chars)
2. Preview text (max 90 chars)
3. A brief intro paragraph (2 sentences max)

Reply ONLY with JSON: {"subject":"...","preview":"...","intro":"..."}`;

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
  const result = JSON.parse(text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim());
  return NextResponse.json(result);
}
