import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/graphMail';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, name, availability, bankAccount } = body;

    const existing = await prisma.cleaner.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const cleaner = await prisma.cleaner.create({
      data: {
        email,
        phone,
        name,
        bankAccount,
        backgroundCheckStatus: 'pending',
        ...(availability && Object.keys(availability).length > 0 && {
          availability: {
            create: Object.entries(availability).map(([day, times]) => ({
              dayOfWeek: parseInt(day),
              startTime: (times as { start: string }).start,
              endTime: (times as { end: string }).end,
              isAvailable: true,
            })),
          },
        }),
      },
    });

    sendMail(
      email,
      'Welcome to CleanDispatch — Application Received',
      `<h2>Hi ${name},</h2>
      <p>Thanks for applying! Your application is under review.</p>
      <p>We'll be in touch within 24–48 hours once your background check is complete.</p>`
    ).catch(err => console.error('Welcome email failed:', err));

    return NextResponse.json(
      { success: true, cleanerId: cleaner.id, message: 'Signup successful. Background check in progress.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Cleaner signup error:', error);
    return NextResponse.json({ error: 'Failed to create cleaner account' }, { status: 500 });
  }
}
