import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/graphMail';

export async function POST(request: NextRequest) {
  const { cleanerId } = await request.json();

  if (!cleanerId) {
    return NextResponse.json({ error: 'Missing cleanerId' }, { status: 400 });
  }

  const cleaner = await prisma.cleaner.update({
    where: { id: cleanerId },
    data: { backgroundCheckStatus: 'approved' },
  });

  // Notify the cleaner
  sendMail(
    cleaner.email,
    'You\'re Approved — Welcome to CleanDispatch!',
    `<h2>Great news, ${cleaner.name}!</h2>
    <p>Your background check has been approved and your CleanDispatch account is now active.</p>
    <p>You'll start receiving job assignments based on your availability. We'll text and email you when a new job is assigned to you.</p>
    <p>Questions? Reply to this email anytime.</p>
    <p>— The CleanDispatch Team</p>`
  ).catch(err => console.error('Cleaner approval email failed:', err));

  return NextResponse.json({ success: true, cleaner });
}
