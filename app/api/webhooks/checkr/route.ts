import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/graphMail';

// Receives Checkr webhook events and updates the cleaner's checkrStatus.
// A "clear" report makes a cleaner eligible for approval; the admin still
// approves manually (also requires work photos). Configure the endpoint URL
// in the Checkr dashboard and set CHECKR_WEBHOOK_SECRET to verify signatures.
export async function POST(request: NextRequest) {
  const raw = await request.text();

  const secret = process.env.CHECKR_WEBHOOK_SECRET;
  if (secret) {
    const signature = request.headers.get('x-checkr-signature') ?? '';
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    if (signature !== expected) {
      console.error('Checkr webhook signature mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const obj = event.data?.object ?? {};
  const candidateId = (obj.candidate_id as string) ?? '';
  const reportId = (obj.id as string) ?? undefined;
  if (!candidateId) {
    return NextResponse.json({ received: true });
  }

  const cleaner = await prisma.cleaner.findFirst({ where: { checkrCandidateId: candidateId } });
  if (!cleaner) {
    return NextResponse.json({ received: true });
  }

  // Map Checkr report state to our checkrStatus.
  let status = cleaner.checkrStatus;
  const type = event.type ?? '';
  if (type.startsWith('report.')) {
    const result = obj.result as string | undefined; // "clear" | "consider"
    const reportStatus = obj.status as string | undefined; // "pending" | "complete" | "suspended"
    if (reportStatus === 'suspended') status = 'suspended';
    else if (result === 'clear') status = 'clear';
    else if (result === 'consider') status = 'consider';
    else status = 'pending';
  }

  await prisma.cleaner.update({
    where: { id: cleaner.id },
    data: { checkrStatus: status, ...(reportId ? { checkrReportId: reportId } : {}) },
  });

  // Alert admin when a report needs a decision or has cleared.
  if (status === 'clear' || status === 'consider') {
    const adminEmail = process.env.ADMIN_EMAIL ?? process.env.MAIL_FROM;
    if (adminEmail) {
      sendMail(
        adminEmail,
        `Background check ${status} — ${cleaner.name}`,
        `<p>Checkr report for <strong>${cleaner.name}</strong> (${cleaner.email}) is <strong>${status}</strong>.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard">Review in admin dashboard →</a></p>`
      ).catch((err) => console.error('Checkr admin alert failed:', err));
    }
  }

  return NextResponse.json({ received: true });
}
