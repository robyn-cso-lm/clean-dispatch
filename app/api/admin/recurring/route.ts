import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateNextVisit } from '@/lib/recurring';

// Admin: pause / resume / cancel a recurring plan, or manually generate the
// next visit (useful if a chain stalled).
export async function POST(request: NextRequest) {
  const { planId, action } = await request.json().catch(() => ({}));
  if (!planId || !action) {
    return NextResponse.json({ error: 'planId and action required.' }, { status: 400 });
  }

  if (action === 'generate') {
    const jobId = await generateNextVisit(planId);
    return NextResponse.json({ success: true, jobId });
  }

  const statusMap: Record<string, string> = { pause: 'paused', resume: 'active', cancel: 'cancelled' };
  const status = statusMap[action];
  if (!status) {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  }

  await prisma.recurringPlan.update({ where: { id: planId }, data: { status } });
  return NextResponse.json({ success: true, status });
}
