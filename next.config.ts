import type { NextConfig } from 'next'
import type { RowDataPacket } from 'mysql2'

type RedirectEntry = {
  source: string
  destination: string
  permanent: boolean
}

type RedirectRow = RowDataPacket & {
  from_path: string
  to_path: string
  status_code: number | null
}

async function loadDbRedirects(): Promise<RedirectEntry[]> {
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
  if (required.some(key => !process.env[key])) return []

  let connection: Awaited<ReturnType<typeof import('mysql2/promise')['createConnection']>> | undefined
  try {
    const mysql = await import('mysql2/promise')
    connection = await mysql.createConnection({
      host:     process.env.DB_HOST,
      port:     Number(process.env.DB_PORT) || 3306,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    })
    const [rows] = await connection.query<RedirectRow[]>('SELECT from_path, to_path, status_code FROM redirects ORDER BY id ASC LIMIT 5000')

    return rows
      .filter(r =>
        r.from_path?.startsWith('/') &&
        !r.from_path.includes('?') &&
        (r.to_path?.startsWith('/') || r.to_path?.startsWith('http'))
      )
      .map(r => ({
        source:      r.from_path,
        destination: r.to_path,
        permanent:   [301, 308].includes(Number(r.status_code ?? 301)),
      }))
  } catch (err) {
    console.warn('[next.config] Could not load DB redirects:', err instanceof Error ? err.message : err)
    return []
  } finally {
    await connection?.end().catch(() => {})
  }
}

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  async redirects() {
    const dbRedirects = await loadDbRedirects()
    return [
      ...dbRedirects,
      {
        source: '/privacy-policy',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/sports',
        destination: '/sportsnews',
        permanent: true,
      },
      {
        source: '/sports/:path*',
        destination: '/sportsnews/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
