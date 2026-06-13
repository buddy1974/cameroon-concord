const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cameroon-concord.com'
const SAMPLE_SIZE = Number(process.env.REDIRECT_AUDIT_LIMIT || 50)

function parseLocs(xml) {
  return Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g))
    .map(match => match[1])
    .filter(url => url.startsWith(SITE_URL))
}

function toLegacyCandidates(url) {
  const parsed = new URL(url)
  const parts = parsed.pathname.split('/').filter(Boolean)
  if (parts.length !== 2) return []

  const [category, slug] = parts
  return [
    `/en/${category}/${slug}`,
    `/en/category-blog-layout-02/${slug}`,
  ].map(path => `${SITE_URL}${path}`)
}

async function statusFor(url) {
  const res = await fetch(url, { method: 'GET', redirect: 'manual' })
  return {
    url,
    status: res.status,
    location: res.headers.get('location') || '',
  }
}

async function main() {
  const sitemap = await fetch(`${SITE_URL}/sitemap.xml`)
  if (!sitemap.ok) {
    throw new Error(`Could not fetch sitemap: ${sitemap.status}`)
  }

  const locs = parseLocs(await sitemap.text())
  const candidates = locs
    .flatMap(toLegacyCandidates)
    .slice(0, SAMPLE_SIZE)

  if (candidates.length === 0) {
    console.log('No article URLs found in sitemap sample.')
    return
  }

  const results = []
  for (const url of candidates) {
    results.push(await statusFor(url))
  }

  const weak = results.filter(result => {
    if (![301, 308].includes(result.status)) return true
    if (!result.location) return true
    return result.location.includes('/category-blog-layout-02/')
  })

  console.table(results)
  console.log(`Checked ${results.length} legacy URL candidates.`)
  console.log(`Redirecting: ${results.length - weak.length}`)
  console.log(`Not redirecting: ${weak.length}`)

  if (weak.length > 0) {
    process.exitCode = 1
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
