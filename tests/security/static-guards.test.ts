/**
 * Repository-wide guards against the Stage 0 bug classes, so they cannot
 * silently return in routes that have no dedicated test.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(name)) out.push(p)
  }
  return out
}

const sourceFiles = ['app', 'lib', 'components'].flatMap(d => walk(join(ROOT, d)))
const routeFiles = walk(join(ROOT, 'app', 'api')).filter(f => f.endsWith(`${sep}route.ts`))
const rel = (f: string) => relative(ROOT, f).split(sep).join('/')

/** Admin routes that are intentionally reachable without a session. */
const PUBLIC_ADMIN_ROUTES = new Set([
  'app/api/admin/auth/login/route.ts',
  'app/api/admin/logout/route.ts',
])
const GUARD = /await requireAdmin\(|requireAutomation\(|await requireAdminOrAutomation\(|await verifyToken\(|checkAutomationKey\(|isAdmin\(|isAuthed\(|authCheck\(/

function handlers(src: string): Array<{ method: string; body: string }> {
  const parts = src.split(/export\s+async\s+function\s+/).slice(1)
  return parts
    .map(p => ({ method: p.match(/^(GET|POST|PUT|PATCH|DELETE)\b/)?.[1] ?? '', body: p }))
    .filter(h => h.method)
}

describe('auth bug classes are eliminated', () => {
  test('no verifyToken() call is used without await', () => {
    const offenders = sourceFiles.flatMap(f =>
      readFileSync(f, 'utf8').split('\n')
        .map((line, i) => ({ line, i }))
        .filter(({ line }) => /\bverifyToken\(/.test(line) && !/await verifyToken\(|function verifyToken|return verifyToken\(/.test(line))
        .map(({ i }) => `${rel(f)}:${i + 1}`))
    assert.deepEqual(offenders, [])
  })

  test('no code authenticates with NEXT_PUBLIC_AUTOMATION_API_KEY', () => {
    const offenders = sourceFiles
      .filter(f => /NEXT_PUBLIC_AUTOMATION_API_KEY/.test(readFileSync(f, 'utf8').replace(/\/\/.*$/gm, '')))
      .filter(f => !rel(f).startsWith('app/api/n8n/health/')) // diagnostics only report presence
      .map(rel)
    assert.deepEqual(offenders, [])
  })

  test('no hard-coded fallback for auth secrets', () => {
    const offenders = sourceFiles
      .filter(f => /process\.env(?:\.|\[['"])(JWT_SECRET|ADMIN_PASSWORD|MAINTENANCE_PASSWORD|AUTOMATION_API_KEY)(?:['"]\])?\s*(\|\||\?\?)\s*['"`][^'"`]/.test(readFileSync(f, 'utf8')))
      .map(rel)
    assert.deepEqual(offenders, [])
  })

  test('every handler under app/api/admin is guarded (except login/logout)', () => {
    const unguarded = routeFiles
      .filter(f => rel(f).startsWith('app/api/admin/') && !PUBLIC_ADMIN_ROUTES.has(rel(f)))
      .flatMap(f => handlers(readFileSync(f, 'utf8'))
        .filter(h => !GUARD.test(h.body.slice(0, 1200)))
        .map(h => `${h.method} ${rel(f)}`))
    assert.deepEqual(unguarded, [])
  })

  test('every handler under app/api/n8n is guarded', () => {
    const unguarded = routeFiles
      .filter(f => rel(f).startsWith('app/api/n8n/'))
      .flatMap(f => handlers(readFileSync(f, 'utf8'))
        .filter(h => !GUARD.test(h.body.slice(0, 1200)))
        .map(h => `${h.method} ${rel(f)}`))
    assert.deepEqual(unguarded, [])
  })
})
