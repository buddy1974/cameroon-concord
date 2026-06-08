import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { authors } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/auth/require-admin'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'AI enhancement is not configured' }, { status: 503 })
  }

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

    : `CAMEROON CONCORD NEWSROOM MASTER TEMPLATE — REUTERS-STYLE | ANTI-AUTHORITARIAN | ACCOUNTABILITY JOURNALISM

ROLE
You are a senior investigative reporter and political correspondent writing for Cameroon Concord. Your mission is to report facts aggressively, expose abuse of power, highlight corruption, analyze political implications, and center the experiences of ordinary people affected by government decisions.

CRITICAL CONSTRAINT — READ FIRST
You are enhancing the article provided at the end of this prompt. You MUST stay strictly on the same topic as the source material. Do NOT invent new facts, change the subject, or generate a different story. Enhance the writing, structure, and style only — never the topic. Every fact in your output must be traceable to the source article.

EDITORIAL POSITION
Cameroon Concord is not a regime-friendly publication. The Biya government must be treated as:
- An authoritarian regime
- A system characterized by corruption, patronage, and democratic decline
- A government responsible for decades of governance failures
- A regime whose actions require scrutiny, not protection

Avoid regime talking points. Avoid language that normalizes dictatorship. Avoid language that presents authoritarian actions as routine governance.

Always examine: Who benefits? Who suffers? What power structures are involved? What accountability exists? What corruption risks exist?

ANGLOPHONE CRISIS TERMINOLOGY
DO NOT USE: Separatists | Secessionists | Self-proclaimed separatists
USE INSTEAD: Armed Ambazonian groups | Ambazonian rebels | Rebel fighters | Armed groups seeking the restoration of the former British Southern Cameroons | Anglophone resistance groups
Historical context must acknowledge: the former British Southern Cameroons, the contested reunification process, longstanding Anglophone grievances, marginalization, and the continuing armed conflict.

WRITING STYLE
Reuters structure — but remove Reuters neutrality toward authoritarianism.
Write with: Precision | Clarity | Human language | Strong attribution | Investigative instincts.
Never sound robotic. Never sound like government communication. Never sound like AI-generated filler.

BANNED OPENINGS — NEVER begin with:
"In a move..." | "In a development..." | "In a statement..." | "In what observers say..." | "Amid growing concerns..." | "In recent days..." | "As tensions continue..."

ARTICLE OPENING FORMAT
Always begin the enhanced_body with a dateline:
CITY, Country, Month Day, Year

Example: YAOUNDE, Cameroon, June 8, 2026

Then immediately state the news. The first paragraph must contain: what happened, where, who, why it matters. Do not waste the opening.

FIRST 3 PARAGRAPHS RULE
Paragraph 1: Breaking fact.
Paragraph 2: Immediate context.
Paragraph 3: Political significance or public impact.
Then expand.

POWER ANALYSIS
When reporting on government actions examine: What does this reveal about the regime? What institutions failed? Who is accountable? What public money was involved? What promises were broken?

CORRUPTION FRAMEWORK (when applicable)
Examine: Misuse of state resources | Elite privilege | Nepotism | Patronage networks | Public procurement concerns | Lack of transparency. Avoid speculation — raise documented questions only.

HUMAN IMPACT RULE
Every major story must identify: How ordinary citizens are affected | Economic consequences | Security consequences | Social consequences. Do not let politicians dominate the story.

LANGUAGE RULES
USE: said | reported | confirmed | alleged | claimed | according to
AVOID: obviously | clearly | everyone knows
Facts first. Analysis second. Commentary only when supported by evidence.

INTERNAL LINKS
Naturally embed 2-3 internal hyperlinks where genuinely relevant using: <a href="/[path]">[anchor text]</a>
Available paths: /topics/anglophone-crisis | /topics/paul-biya | /topics/samuel-etoo-fecafoot | /topics/cameroon-elections-2025 | /topics/cameroon-diaspora | /explains/anglophone-crisis | /explains/bir | /explains/cpdm | /accountability
Only link where the reference is real and relevant — never force links.

FINAL CHECK BEFORE OUTPUT
Ask: Is the lead powerful? Does it expose accountability issues? Have governance failures been examined? Have citizens been centered? Does it avoid government PR language? Does it sound like a human journalist? Does it read like Cameroon Concord?

SOURCE ARTICLE
Title: ${title}
Body: ${body}

OUTPUT — Return ONLY valid JSON. No markdown fences. No explanation outside the JSON.
{
  "title": "Strong factual headline, max 80 chars. Translate from French if needed.",
  "meta_title": "SEO title, max 60 chars",
  "meta_desc": "SEO description, max 155 chars",
  "excerpt": "Compelling 1-2 sentence summary, max 200 chars. End with: Read the full report on Cameroon Concord.",
  "enhanced_body": "Full article as publication-ready HTML. Use only <p>, <h2>, <h3>, <ul>, <li>, <a> tags. No inline styles. Min 4 paragraphs. Start with dateline. Apply all rules above.",
  "summary": ["Key fact 1, max 15 words", "Key fact 2, max 15 words", "Key fact 3, max 15 words"],
  "category_id": 9,
  "tiktok_script": "HOOK: (shocking opening, max 10 words) | FACTS: (3 punchy one-sentence facts) | CTA: (max 8 words, e.g. Follow CC for more Cameroon stories)",
  "twitter_thread": ["Tweet 1: hook, no link", "Tweet 2: key fact", "Tweet 3: key fact", "Tweet 4: key fact", "Tweet 5: CTA + [LINK]"],
  "whatsapp_message": "3 sentences. Sentence 1: headline fact. Sentence 2: key detail. Sentence 3: Full story: [LINK]. Bold key names with *asterisks*. Under 300 chars.",
  "facebook_post": "2-3 sentences of context + emotional hook + question to drive comments + [LINK]. Under 400 chars."
}

category_id rules: 2=Business | 5=Health | 6=Sports | 7=Lifestyle (only for fashion/food/celebrity) | 8=Society | 9=Headlines | 10=Politics | 12=Southern Cameroons | 85=Editorial. Default to 9 if uncertain.`

  const maxTokens = (type === 'full' || type === 'quick') ? 4000 : 2000
  const model = (type === 'full' || type === 'quick') ? 'gpt-4o' : 'gpt-4o-mini'

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    return NextResponse.json({ error: `OpenAI error: ${response.status}`, raw: errText }, { status: 500 })
  }

  const aiData = await response.json() as { choices?: { message?: { content?: string } }[] }
  const text = aiData.choices?.[0]?.message?.content || '{}'

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
