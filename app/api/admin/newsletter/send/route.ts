import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { newsletterSubscribers, newsletterSends } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || !verifyToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subject, htmlBody, preview } = await req.json();
  if (!subject || !htmlBody) return NextResponse.json({ error: 'Missing subject or body' }, { status: 400 });

  const subscribers = await db.select({ email: newsletterSubscribers.email, token: newsletterSubscribers.token })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, 'confirmed'));

  if (subscribers.length === 0) {
    return NextResponse.json({ error: 'No confirmed subscribers yet' }, { status: 400 });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });

  let sent = 0;
  for (const sub of subscribers) {
    const unsubUrl = `https://www.cameroon-concord.com/api/newsletter/unsubscribe?token=${sub.token}`;
    const finalHtml = htmlBody.replace('{{UNSUBSCRIBE_URL}}', unsubUrl);

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Cameroon Concord <news@cameroon-concord.com>',
        to: sub.email,
        subject,
        html: finalHtml,
      })
    });
    sent++;
  }

  await db.insert(newsletterSends).values({ subject, body: htmlBody, sentBy: 'admin', recipientCount: sent });
  return NextResponse.json({ success: true, sent });
}
