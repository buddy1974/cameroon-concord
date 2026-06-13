import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/constants'

export async function GET() {
  return NextResponse.redirect(`${SITE_URL}/news-sitemap.xml`, 308)
}
