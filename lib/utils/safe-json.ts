export function safeJsonArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[]
  if (typeof val === 'string' && val.startsWith('[')) {
    try { return JSON.parse(val) as T[] } catch { return [] }
  }
  return []
}

export function safeJsonObject<T>(val: unknown, fallback: T): T {
  if (val && typeof val === 'object' && !Array.isArray(val)) return val as T
  if (typeof val === 'string' && val.startsWith('{')) {
    try { return JSON.parse(val) as T } catch { return fallback }
  }
  return fallback
}
