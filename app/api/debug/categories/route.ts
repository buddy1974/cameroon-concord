import { NextResponse } from 'next/server'
import { getAllCategories } from '@/lib/db/queries'

export async function GET() {
  const cats = await getAllCategories()
  return NextResponse.json({
    count: cats.length,
    slugs: cats.map(c => ({ id: c.id, slug: c.slug, name: c.name })),
  })
}
