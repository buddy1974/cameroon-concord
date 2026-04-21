import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { countryVisits } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

const COUNTRY_NAMES: Record<string, string> = {
  CM: 'Cameroon',        DE: 'Germany',         GB: 'United Kingdom',
  US: 'United States',   FR: 'France',           CA: 'Canada',
  NG: 'Nigeria',         GH: 'Ghana',            ZA: 'South Africa',
  BE: 'Belgium',         NL: 'Netherlands',      CH: 'Switzerland',
  IT: 'Italy',           ES: 'Spain',            SN: 'Senegal',
  CI: "Côte d'Ivoire",   KE: 'Kenya',            AO: 'Angola',
  CD: 'DR Congo',        AU: 'Australia',        SE: 'Sweden',
  NO: 'Norway',          DK: 'Denmark',          AT: 'Austria',
}

export async function POST(req: NextRequest) {
  const country = req.headers.get('cf-ipcountry') ||
                  req.headers.get('x-vercel-ip-country') || 'XX'

  if (country === 'XX' || country === 'T1') return NextResponse.json({ ok: true })

  const name = COUNTRY_NAMES[country] || country

  await db.execute(
    sql`INSERT INTO country_visits (country_code, country_name, visit_count, last_seen)
        VALUES (${country}, ${name}, 1, NOW())
        ON DUPLICATE KEY UPDATE visit_count = visit_count + 1, last_seen = NOW()`
  )

  return NextResponse.json({ ok: true })
}

export async function GET() {
  const rows = await db
    .select()
    .from(countryVisits)
    .orderBy(sql`visit_count DESC`)
    .limit(30)
  return NextResponse.json(rows)
}
