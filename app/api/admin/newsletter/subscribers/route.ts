import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { newsletterSubscribers } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || !verifyToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [rows, countRows] = await Promise.all([
    db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt)).limit(100),
    db.select({ id: newsletterSubscribers.id }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status, 'confirmed'))
  ]);

  return NextResponse.json({ subscribers: rows, count: countRows.length });
}
