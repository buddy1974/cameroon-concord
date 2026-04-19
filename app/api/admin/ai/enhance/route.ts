import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/db/client'
import { authors } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  const { title, body, type } = await req.json() as {
    title: string; body: string; type: 'meta' | 'excerpt' | 'full' | 'quick'
  }

  const prompt = type === 'quick'
    ? `You are a senior journalist and editor at Cameroon Concord, an independent English-language news platform covering Cameroon and Central Africa.

Given raw text (which may be in French or another language), produce a complete publication-ready article.

Rules:
- Translate to English if needed
- Rewrite in CC journalistic style (factual, authoritative, no sensationalism)
- Assign the most relevant category from this list only: politics, society, sportsnews, southern-cameroons, business, health, headlines, inside-cpdm

Return ONLY valid JSON. No markdown fences. No explanation.
{
  "title": "max 80 chars, punchy English headline",
  "slug": "lowercase-url-slug-from-title",
  "excerpt": "max 200 chars, compelling 1-2 sentence summary",
  "enhanced_body": "<p>Full article HTML, min 4 paragraphs. Use only p, h2, h3, ul, li tags. No inline styles.</p>",
  "category_slug": "one of: politics|society|sportsnews|southern-cameroons|business|health|headlines|inside-cpdm",
  "meta_title": "max 60 chars SEO title",
  "meta_desc": "max 155 chars SEO description",
  "keywords": ["keyword1","keyword2","keyword3","keyword4","keyword5"]
}

Raw text:
${body}`

    : type === 'meta'
    ? `Generate SEO meta_title (max 60 chars) and meta_desc (max 155 chars) for this Cameroon news article.
Title: ${title}
Body: ${body.slice(0, 500)}
Return JSON only: {"meta_title":"...","meta_desc":"..."}`

    : type === 'excerpt'
    ? `You are a senior news editor for Cameroon Concord, an independent, regime-critical Cameroonian news publication. Write a compelling 1-2 sentence excerpt, max 200 characters, that is sharp and direct in tone.
Title: ${title}
Body: ${body.slice(0, 800)}
Return JSON only: {"excerpt":"..."}`

    : `You are a senior news editor for Cameroon Concord, an independent English-language news publication covering Cameroon and the Southern Cameroons since 2014. Cameroon Concord has a clear editorial stance: critical of the Paul Biya regime and the CPDM party-state, which has ruled Cameroon for over 43 years through authoritarianism, systemic corruption, electoral manipulation, and brutal military repression — particularly in the Anglophone regions. The publication holds power to account, amplifies suppressed voices, and does not soften or neutralise criticism of the regime, its officials, or its institutions.

Editorial tone guidelines:
- Be factual, sharp, and unflinching — never use neutral bureaucratic language when describing regime actions
- Refer to the government critically where evidence supports it: "the regime", "Biya's government", "CPDM authorities"
- Do not sanitise military violence, corruption, or political repression — name it clearly
- Anglophone crisis coverage must reflect the human cost and the regime's militarised response
- Never frame Biya or CPDM officials sympathetically or present propaganda as neutral fact
- Maintain journalistic integrity — critical does not mean inaccurate; every claim must be supportable

Given the article title and raw body below, return a JSON object with these six fields:
- title: enhanced English headline, max 80 characters, punchy and journalistic. If the original title is in French or another language, translate it to English.
- meta_title: SEO title, max 60 characters
- meta_desc: SEO description, max 155 characters
- excerpt: compelling 1-2 sentence summary, max 200 characters
- enhanced_body: the full article rewritten as publication-ready HTML. Use only <p>, <h2>, <h3>, <ul>, <li> tags. No inline styles. Minimum 4 paragraphs. Maintain the editorial tone above. Expand and develop the content using the source material.
- summary: array of exactly 3 bullet point strings, each max 15 words, sharply summarising the key facts of the article. No bullet symbols — plain strings only.

Title: ${title}
Body: ${body}

Return ONLY valid JSON. No markdown fences. No explanation.
{"title":"...","meta_title":"...","meta_desc":"...","excerpt":"...","enhanced_body":"...","summary":["...","...","..."]}`

  const message = await claude.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: type === 'quick' ? 4000 : type === 'full' ? 2500 : 2000,
    messages:   [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (type === 'full') {
      const authorSlugs = ['nkemdirim-tabi','ebot-ayuk','cynthia-mbah','fidelis-ngong','solange-achu','emeka-tambe','bridget-forjindam','ndong-eyong']
      const randomSlug = authorSlugs[Math.floor(Math.random() * authorSlugs.length)]
      const [author] = await db.select({ id: authors.id, name: authors.name, slug: authors.slug, avatarUrl: authors.avatarUrl })
        .from(authors).where(eq(authors.slug, randomSlug)).limit(1)
      return NextResponse.json({ ...parsed, author_id: author?.id, author_name: author?.name, author_avatar: author?.avatarUrl })
    }

    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Parse failed', raw: text }, { status: 500 })
  }
}
