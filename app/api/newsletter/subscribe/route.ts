import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { newsletterSubscribers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  const { email, source } = await req.json();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const normalized = email.toLowerCase().trim();

  // Check if already subscribed
  const existing = await db.select({ id: newsletterSubscribers.id, status: newsletterSubscribers.status })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, normalized))
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].status === 'confirmed') {
      return NextResponse.json({ success: true, message: 'Already subscribed' });
    }
    // Re-confirm if previously unsubscribed
    await db.update(newsletterSubscribers)
      .set({ status: 'confirmed' })
      .where(eq(newsletterSubscribers.email, normalized));
    return NextResponse.json({ success: true });
  }

  const token = randomBytes(32).toString('hex');

  await db.insert(newsletterSubscribers).values({
    email: normalized,
    token,
    status: 'confirmed', // direct confirm — no email verification for now
  });

  return NextResponse.json({ success: true });
}
