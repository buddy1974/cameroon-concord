import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';

type NewsletterArticleInput = { title: string };

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'AI newsletter generation is not configured' }, { status: 503 });
  }

  const { articles, template } = await req.json() as { articles?: NewsletterArticleInput[]; template?: string };
  if (!Array.isArray(articles) || typeof template !== 'string') {
    return NextResponse.json({ error: 'Invalid newsletter generation request' }, { status: 400 });
  }

  const titles = articles.map((a) => a.title).join('\n- ');
  const prompt = `You are the editor of Cameroon Concord news. Given these article titles:
- ${titles}

Generate for a ${template} newsletter:
1. A compelling email subject line (max 60 chars)
2. Preview text (max 90 chars)
3. A brief intro paragraph (2 sentences max)

Reply ONLY with JSON: {"subject":"...","preview":"...","intro":"..."}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text()
    return NextResponse.json({ error: `OpenAI error: ${response.status}`, raw: errText }, { status: 500 });
  }

  const aiData = await response.json() as { choices?: { message?: { content?: string } }[] };
  const text = aiData.choices?.[0]?.message?.content || '{}';
  const result = JSON.parse(text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim());
  return NextResponse.json(result);
}
