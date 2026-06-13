import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/graphMail';
import { checkrConfigured } from '@/lib/checkr';

export async function POST(request: NextRequest) {
  const { cleanerId, force } = await request.json();

  if (!cleanerId) {
    return NextResponse.json({ error: 'Missing cleanerId' }, { status: 400 });
  }

  const cleaner = await prisma.cleaner.findUnique({
    where: { id: cleanerId },
    include: { _count: { select: { workPhotos: true } } },
  });

  if (!cleaner) {
    return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 });
  }

  // Approval gate: must have submitted work photos, and (if Checkr is wired up)
  // the background check must be clear. Admin can override with `force`.
  if (!force) {
    const blockers: string[] = [];
    if (cleaner._count.workPhotos === 0) blockers.push('no work photos submitted');
    if (checkrConfigured() && cleaner.checkrStatus !== 'clear') {
      blockers.push(`background check is "${cleaner.checkrStatus}" (needs "clear")`);
    }
    if (blockers.length > 0) {
      return NextResponse.json(
        { error: `Cannot approve yet: ${blockers.join('; ')}.`, blockers, canForce: true },
        { status: 422 }
      );
    }
  }

  const updated = await prisma.cleaner.update({
    where: { id: cleanerId },
    data: { backgroundCheckStatus: 'approved' },
  });

  const accessUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cleaner/availability?token=${updated.accessToken}`;

  sendMail(
    cleaner.email,
    "You're Approved — Welcome to CleanDispatch!",
    `<h2>Great news, ${cleaner.name}!</h2>
    <p>Your application has been approved and your CleanDispatch account is now active.</p>
    <p>You'll start receiving job assignments based on your availability. We'll text and email you when a new job is assigned to you.</p>
    <p><strong>Manage your weekly availability anytime:</strong><br>
    <a href="${accessUrl}">${accessUrl}</a></p>
    <p>Keep this link private — it's your personal access to your schedule.</p>
    <p>— The CleanDispatch Team</p>`
  ).catch((err) => console.error('Cleaner approval email failed:', err));

  return NextResponse.json({ success: true, cleaner: updated });
}
