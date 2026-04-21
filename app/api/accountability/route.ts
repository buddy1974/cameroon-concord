import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { accountabilityPromises } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  const rows = await db
    .select()
    .from(accountabilityPromises)
    .orderBy(desc(accountabilityPromises.dateMade))
  return NextResponse.json(rows)
}
