export type PromptDateContext = {
  currentDate: string
  currentISODate: string
  promptBlock: string
}

export function getPromptDateContext(now = new Date()): PromptDateContext {
  const currentISODate = now.toISOString().slice(0, 10)
  const currentDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  }).format(now)

  return {
    currentDate,
    currentISODate,
    promptBlock: `CURRENT DATE CONTEXT
Current runtime date: ${currentDate}. Current ISO date: ${currentISODate}.
Use this date for interpreting today, yesterday, tomorrow, and current events.
Never use model knowledge cutoff dates.
Never replace source dates with another year.
If the source says 2026, keep 2026.
If the source says today, resolve it using the runtime current date.
If a date is unclear, keep it general or attribute it to the source.
Supplied text beats model memory.`,
  }
}
