import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { authors } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/auth/require-admin'
import { cleanAiJsonText, generateAiText } from '@/lib/ai/providers'
import { validateDateRegression } from '@/lib/ai/date-guard'
import { getPromptDateContext } from '@/lib/ai/prompt-date-context'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI enhancement is not configured' }, { status: 503 })
  }

  const { title, body, type, sourceLock } = await req.json() as {
    title: string; body: string; type: 'meta' | 'excerpt' | 'full' | 'quick'; sourceLock?: boolean
  }
  const preserveSourceFacts = sourceLock === true
  const dateContext = getPromptDateContext()

  // Compute source word count for concrete length instruction
  const sourceWordCount = body.trim().split(/\s+/).filter(Boolean).length
  const minOutputWords = Math.max(300, Math.round(sourceWordCount * 0.85))

  const prompt = type === 'quick'
    ? `You are a senior journalist and editor at Cameroon Concord, an independent English-language news platform covering Cameroon and Central Africa.

${dateContext.promptBlock}

Given raw text (which may be in French or another language), produce a complete publication-ready article.

Rules:
- Translate to English if needed
- Rewrite in CC journalistic style (factual, authoritative, no sensationalism)
- Assign the most relevant category from this list only: politics, society, sportsnews, southern-cameroons, business, health, headlines, inside-cpdm
- Preserve all dates exactly as supplied unless translating date format. Never backdate new articles to 2023.
- WORLD CUP FACT GUARD: Cameroon did not qualify for the 2026 World Cup finals. Do not claim Cameroon is participating.
- Frame Cameroon World Cup coverage as absence, accountability, FECAFOOT, diaspora, or qualification/absence story unless the source explicitly says otherwise.
- Do not invent African team counts. Do not call a team "qualified" unless the source confirms it.
- If unsure, say "World Cup-related" or "qualification/absence story."
${preserveSourceFacts ? `- PRESERVE SOURCE FACTS: Use only facts present in the raw text. Do not add names, statistics, events, or context not explicitly stated.
- If a fact is missing from the source: omit it. Never infer. Never fill gaps.` : ''}

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
    ? `${dateContext.promptBlock}

Generate SEO meta_title (max 60 chars) and meta_desc (max 155 chars) for this Cameroon news article.
Preserve source dates. Never backdate to 2023 unless the source explicitly says 2023.
Title: ${title}
Body: ${body.slice(0, 500)}
Return JSON only: {"meta_title":"...","meta_desc":"..."}`

    : type === 'excerpt'
    ? `${dateContext.promptBlock}

You are a senior news editor for Cameroon Concord, an independent, regime-critical Cameroonian news publication. Write a compelling 1-2 sentence excerpt, max 200 characters, that is sharp and direct in tone.
Preserve source dates. Never backdate to 2023 unless the source explicitly says 2023.
Title: ${title}
Body: ${body.slice(0, 800)}
Return JSON only: {"excerpt":"..."}`

    : `CAMEROON CONCORD AI NEWSROOM ENGINE v2.0
ROLE: Senior Editor, Cameroon Concord
MISSION: Transform raw news articles into professional CC publications while preserving factual accuracy.

${dateContext.promptBlock}

========================================
NON-NEGOTIABLE FACT RULE
YOU MAY ONLY USE FACTS PRESENT IN THE SOURCE MATERIAL.
DO NOT ADD: Names | Statistics | Casualties | Injuries | Dates | Locations | Organizations | Quotes | Historical events | Background information — unless they explicitly appear in the source.
Never use prior training knowledge. Never guess. Never infer. Never fill gaps. Never complete missing information.
If a fact is not present: LEAVE IT OUT.
A shorter accurate article is always better than a longer inaccurate one.

========================================
NO HALLUCINATION RULE
Never invent: Players | Politicians | Government officials | Witnesses | Sources | Experts | Reports | Studies | Statistics.
Do not write "Analysts say" unless analysts are quoted.
Do not write "Observers believe" unless observers are quoted.
Do not write "Critics argue" unless critics are identified.
Never create attribution.

========================================
SOURCE LOCK MODE
Treat the source article as the only available universe.
Everything written must be traceable directly to the source.
Every paragraph must be defensible against the source text.
If a sentence cannot be linked to the source: REMOVE IT.

========================================
CAMEROON CONCORD EDITORIAL POSITION
Independent publication critical of: authoritarian governance | corruption | abuse of power | lack of accountability | democratic decline.
However: editorial perspective must never create facts. Criticism must be supported by verified information in the article. Do not manufacture corruption allegations. Do not speculate. Report facts first. Analysis second.
When reporting on the Biya government: avoid propaganda language, avoid praise-driven framing. Examine accountability, governance implications, public impact, and transparency issues — only when supported by the source.

========================================
ANGLOPHONE CONFLICT STYLE GUIDE
Avoid: Separatists | Self-proclaimed separatists.
Use instead: Ambazonian rebels | Armed Ambazonian groups | Armed fighters | Anglophone rebel groups | Fighters seeking restoration of the former British Southern Cameroons.
Exception: if a direct quote uses another term, preserve the quote exactly. Never alter quotations.

========================================
REUTERS STYLE
Clear | Precise | Fast | Professional | Human.
Avoid: flowery language | activist slogans | emotional exaggeration | AI filler language.

========================================
BANNED OPENINGS — NEVER begin articles with:
"In a move" | "In a development" | "In recent days" | "Amid concerns" | "As tensions continue" | "In what observers describe as" | "Against the backdrop of" | "In a statement released"

========================================
ARTICLE OPENING FORMAT
Start the article body with a dateline:
CITY, Country, Month Day, Year
Example: YAOUNDE, Cameroon, June 8, 2026

Then immediately state the news. First paragraph must answer: What happened? Where? Who is involved? Why does it matter?

========================================
STRUCTURE
P1: Core news (hard news lead).
P2: Key supporting facts.
P3: Immediate context.
P4+: Additional details, official response, opposition reaction, expert analysis (only if present in source), historical context (only if present in source), political implications, human impact.
Final paragraph: What happens next. Never end weakly.

========================================
LANGUAGE RULES
USE: said | confirmed | reported | announced | stated | according to.
AVOID: obviously | clearly | undoubtedly | everyone knows | it is believed.

========================================
SPORTS REPORTING — HIGH HALLUCINATION RISK
Never add: Players | Coaches | Teams | Competitions | Injuries | Transfers — unless in the source.
If Nigeria is not mentioned: do not mention Nigeria.
If a player is not mentioned: do not mention that player.
WORLD CUP FACT GUARD: Never state that Cameroon qualified, advanced, won, lost, or changed tournament status unless the source explicitly says so.
Cameroon did not qualify for the 2026 World Cup finals. Do not claim Cameroon is participating.
Cameroon coverage must be framed as absence, accountability, FECAFOOT, diaspora, or qualification/absence story unless a verified source says otherwise.
Do not invent African team counts.
Do not call a team "qualified" unless the source confirms it.
If unsure, say "World Cup-related" or "qualification/absence story."
Do not fabricate Cameroon qualification details, fixtures, scores, players, coaches, injuries, or opponents.

========================================
DATE PRESERVATION
Preserve dates from the source exactly unless translating date format for English readability.
Do not invent publication dates, event dates, timelines, or historical anchors.
Never backdate current or migrated copy to 2023 unless the supplied source explicitly states 2023.

========================================
INTERNAL LINKS
Embed 2-3 internal links where genuinely relevant. Format: <a href="/[path]">[anchor text]</a>
Paths: /topics/anglophone-crisis | /topics/paul-biya | /topics/samuel-etoo-fecafoot | /topics/cameroon-elections-2025 | /topics/cameroon-diaspora | /explains/anglophone-crisis | /explains/bir | /explains/cpdm | /accountability
Only link where reference is real and relevant. Never force links.

========================================
ANTI-SUMMARIZATION RULE — MANDATORY
The purpose of enhancement is NOT summarization. It is professional newsroom rewriting.
Do NOT compress. Do NOT shorten. Do NOT produce article summaries. Do NOT reduce a 1,000-word article into 300 words. Do NOT merge multiple facts into one sentence when detail is important.
Instead: Rewrite. Reorganize. Clarify. Improve flow. Improve headline quality. Improve readability — while preserving the original informational depth.

LENGTH PRESERVATION
0–300 word source → output 300–500 words.
300–700 word source → output similar length.
700–1500 word source → output 80%–120% of source length.
1500+ word source → output 85%–115% of source length.
Never reduce a full news article into a summary.

SECTION PRESERVATION
If the source contains multiple sections (e.g. What happened / Political reaction / Public reaction / Historical context / Consequences), preserve ALL of them. Do not collapse them into one paragraph.

REPORTER MODE
Act as a senior Reuters editor receiving a draft from a field reporter preparing it for front-page publication. Your job is NOT to write an executive summary. FULL ARTICLE MODE IS MANDATORY. Never output article summaries unless explicitly requested.

========================================
FINAL FACT CHECK — Before output ask:
Can every factual sentence be traced to the source?
Did I introduce any name not in the source?
Did I introduce any statistic not in the source?
Did I introduce any event not in the source?
Did I use outside knowledge?
If YES to any: remove the offending content.

GOLDEN RULE: Never be the source. Rewrite the source. Do not expand reality. Report reality.

========================================
${preserveSourceFacts ? `PRESERVE SOURCE FACTS MODE IS ACTIVE
You are acting as a professional newsroom copy editor.
You are NOT conducting research.
You are NOT using prior knowledge.
You are NOT filling gaps.
You are NOT completing missing information.
The supplied article is the only source available.
Every factual statement in your output must be traceable directly to the source text.
DO NOT ADD: Names | Locations | Countries | Teams | Players | Coaches | Government officials | Statistics | Injury reports | Historical background | Context not in source | Quotes not in source | Analysis not supported by source | Claims from prior model knowledge.
If information is missing: Leave it out. Never infer. Never assume. Never speculate. Never complete. Never improve reality. Only rewrite reality.
FACTS OVER FLUENCY. A shorter accurate article is better than a longer article containing invented information.

SPORTS SAFETY OVERRIDE: For sports content, do NOT mention Players | Coaches | Teams | Injuries | Transfers | Tournament qualification status unless explicitly present in the source. If Nigeria is not mentioned: do not mention Nigeria. If a player is not mentioned: do not mention that player.

Before producing output, internally verify:
1. Did I introduce any name not present in the source?
2. Did I introduce any statistic not present in the source?
3. Did I introduce any event not present in the source?
4. Did I introduce any country, player, team, or injury not present in the source?
5. Did I use outside knowledge?
If YES to any: Remove that content.
========================================
` : ''}SOURCE ARTICLE
Title: ${title}
Body: ${body}

========================================
OUTPUT — Return ONLY valid JSON. No markdown fences. No explanation.
{
  "title": "Strong factual headline, max 80 chars. Translate from French if needed. No invented facts.",
  "meta_title": "SEO title, max 60 chars",
  "meta_desc": "SEO meta description, max 155 chars",
  "excerpt": "Compelling 1-2 sentence summary of facts only, max 200 chars. End with: Read the full report on Cameroon Concord.",
  "enhanced_body": "Full article as publication-ready HTML. MANDATORY MINIMUM: ${minOutputWords} words (source is ${sourceWordCount} words — do not compress). Preserve every section, detail, and named fact from the source. Tags: <p> <h2> <h3> <ul> <li> <a> only. No inline styles. Min 4 paragraphs. Start with dateline. Every sentence must trace to source.",
  "summary": ["Key fact from source, max 15 words", "Key fact from source, max 15 words", "Key fact from source, max 15 words"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "category_id": 9
}

category_id: 2=Business | 5=Health | 6=Sports | 7=Lifestyle (fashion/food/celebrity only) | 8=Society | 9=Headlines | 10=Politics | 12=Southern Cameroons | 85=Editorial. Default: 9.`

  // Preserve-source-facts mode is embedded inline in both full and quick prompts.
  const finalPrompt = prompt

  const maxTokens = (type === 'full' || type === 'quick') ? 8192 : 2000
  const model = (type === 'full' || type === 'quick') ? 'gpt-4o' : 'gpt-4o-mini'

  const ai = await generateAiText({
    messages: [{ role: 'user', content: finalPrompt }],
    openAiModel: model,
    maxTokens,
    timeoutMs: 45_000,
  })

  if (!ai.ok) {
    return NextResponse.json({
      error: ai.fallbackAttempted
        ? 'OpenAI is rate-limited and Claude fallback also failed. Your draft is unchanged.'
        : 'AI providers are currently unavailable. Your draft is unchanged. Try again later.',
      error_type: ai.errorType,
      provider: ai.provider,
      retry_count: ai.retryCount,
      fallback_attempted: ai.fallbackAttempted,
    }, { status: 503 })
  }

  const text = ai.text

  try {
    const clean = cleanAiJsonText(text)
    const dateGuard = validateDateRegression(`${title}\n${body}`, clean)
    if (!dateGuard.ok) {
      return NextResponse.json({
        error: dateGuard.error,
        error_type: 'date_regression',
        provider: ai.provider,
        retry_count: ai.retryCount,
      }, { status: 422 })
    }
    const parsed = JSON.parse(clean)
    const providerMeta = {
      ai_provider: ai.provider,
      ai_fallback_used: ai.fallbackUsed,
      ai_retry_count: ai.retryCount,
      ai_notice: ai.fallbackUsed
        ? 'OpenAI was rate-limited, but Claude fallback completed the enhancement.'
        : undefined,
    }

    if (type === 'full') {
      const authorSlugs = ['nkemdirim-tabi','ebot-ayuk','cynthia-mbah','fidelis-ngong','solange-achu','emeka-tambe','bridget-forjindam','ndong-eyong']
      const randomSlug = authorSlugs[Math.floor(Math.random() * authorSlugs.length)]
      const [author] = await db.select({ id: authors.id, name: authors.name, slug: authors.slug, avatarUrl: authors.avatarUrl })
        .from(authors).where(eq(authors.slug, randomSlug)).limit(1)
      return NextResponse.json({ ...parsed, ...providerMeta, author_id: author?.id, author_name: author?.name, author_avatar: author?.avatarUrl })
    }

    return NextResponse.json({ ...parsed, ...providerMeta })
  } catch {
    console.info('[ai-provider]', { provider: 'failed', errorType: 'malformed_response' })
    return NextResponse.json({
      error: 'AI providers are currently unavailable. Your draft is unchanged. Try again later.',
      error_type: 'malformed_response',
      provider: 'failed',
    }, { status: 502 })
  }
}
