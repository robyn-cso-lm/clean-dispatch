import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Token-gated self-service availability. Cleaners reach this via the personal
// link in their approval email (?token=<accessToken>) — no full login yet.

async function cleanerFromToken(token: string | null) {
  if (!token) return null;
  return prisma.cleaner.findUnique({
    where: { accessToken: token },
    select: {
      id: true,
      name: true,
      backgroundCheckStatus: true,
      availability: {
        select: { dayOfWeek: true, startTime: true, endTime: true, isAvailable: true },
      },
    },
  });
}

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token');
  const cleaner = await cleanerFromToken(token);
  if (!cleaner) {
    return NextResponse.json({ error: 'Invalid or missing access link.' }, { status: 401 });
  }
  return NextResponse.json({
    name: cleaner.name,
    status: cleaner.backgroundCheckStatus,
    availability: cleaner.availability,
  });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const token: string | null = body.token ?? null;
  const cleaner = await cleanerFromToken(token);
  if (!cleaner) {
    return NextResponse.json({ error: 'Invalid or missing access link.' }, { status: 401 });
  }

  // availability: { "<dayOfWeek>": { start, end, enabled } }
  const incoming = body.availability as
    | Record<string, { start: string; end: string; enabled: boolean }>
    | undefined;
  if (!incoming) {
    return NextResponse.json({ error: 'Missing availability.' }, { status: 400 });
  }

  const rows = Object.entries(incoming)
    .filter(([, v]) => v.enabled && v.start && v.end && v.start < v.end)
    .map(([day, v]) => ({
      cleanerId: cleaner.id,
      dayOfWeek: parseInt(day, 10),
      startTime: v.start,
      endTime: v.end,
      isAvailable: true,
    }));

  // Replace the whole weekly schedule atomically.
  await prisma.$transaction([
    prisma.availability.deleteMany({ where: { cleanerId: cleaner.id } }),
    ...(rows.length > 0 ? [prisma.availability.createMany({ data: rows })] : []),
  ]);

  return NextResponse.json({ success: true, count: rows.length });
}
