export type DateGuardResult = {
  ok: true
} | {
  ok: false
  error: string
}

export function extractYears(text: string): Set<string> {
  return new Set(text.match(/\b(?:19|20)\d{2}\b/g) ?? [])
}

export function validateDateRegression(sourceText: string, outputText: string): DateGuardResult {
  const sourceYears = extractYears(sourceText)
  const outputYears = extractYears(outputText)

  if (sourceYears.has('2026') && !sourceYears.has('2023') && outputYears.has('2023')) {
    return {
      ok: false,
      error: 'AI enhancement rejected because it changed the article year from 2026 to 2023. Please retry or enhance without altering dates.',
    }
  }

  return { ok: true }
}
