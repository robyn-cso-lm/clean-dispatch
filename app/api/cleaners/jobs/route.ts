import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyUser } from '@/lib/notifications';
import { chargeJobBalance } from '@/lib/billing';
import { generateNextVisit } from '@/lib/recurring';

// Token-gated job board for a cleaner: list their assignments and act on them
// (accept / decline / mark complete). The token is their personal accessToken.

async function cleanerFromToken(token: string | null) {
  if (!token) return null;
  return prisma.cleaner.findUnique({ where: { accessToken: token } });
}

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token');
  const cleaner = await cleanerFromToken(token);
  if (!cleaner) {
    return NextResponse.json({ error: 'Invalid or missing access link.' }, { status: 401 });
  }

  const assignments = await prisma.jobAssignment.findMany({
    where: { cleanerId: cleaner.id },
    orderBy: { createdAt: 'desc' },
    include: { job: { include: { client: { select: { name: true, address: true, city: true, phone: true } } } } },
  });

  const shape = (a: (typeof assignments)[number]) => ({
    assignmentId: a.id,
    status: a.status,
    onHold: a.onHold,
    actualHours: a.actualHours,
    job: {
      serviceType: a.job.serviceType,
      scheduledDate: a.job.scheduledDate,
      scheduledTime: a.job.scheduledTime,
      estimatedHours: a.job.estimatedHours,
      quoteAmount: a.job.quoteAmount,
      bedrooms: a.job.bedrooms,
      bathrooms: a.job.bathrooms,
      specialRequests: a.job.specialRequests,
      client: a.job.client,
    },
    payout:
      Math.round(
        (((a.actualHours ?? a.job.estimatedHours) * cleaner.hourlyRate) + cleaner.gasFee) * 100
      ) / 100,
  });

  const pending = assignments.filter((a) => a.status === 'pending').map(shape);
  const accepted = assignments.filter((a) => a.status === 'accepted').map(shape);
  const completed = assignments.filter((a) => a.status === 'completed').map(shape);
  const earned = completed.reduce((sum, c) => sum + c.payout, 0);

  return NextResponse.json({
    name: cleaner.name,
    approved: cleaner.backgroundCheckStatus === 'approved',
    hourlyRate: cleaner.hourlyRate,
    gasFee: cleaner.gasFee,
    rating: cleaner.rating,
    reviewCount: cleaner.reviewCount,
    earned: Math.round(earned * 100) / 100,
    pending,
    accepted,
    completed,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { token, assignmentId, action, actualHours } = body;

  const cleaner = await cleanerFromToken(token);
  if (!cleaner) {
    return NextResponse.json({ error: 'Invalid or missing access link.' }, { status: 401 });
  }

  const assignment = await prisma.jobAssignment.findUnique({
    where: { id: assignmentId },
    include: { job: { include: { client: true } } },
  });
  if (!assignment || assignment.cleanerId !== cleaner.id) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  }

  if (action === 'accept') {
    await prisma.jobAssignment.update({ where: { id: assignmentId }, data: { status: 'accepted' } });
    await prisma.job.update({ where: { id: assignment.jobId }, data: { status: 'accepted' } });
    notifyUser(assignment.job.client.email, assignment.job.client.phone, 'job_accepted', {
      cleanerName: cleaner.name,
      cleanerRating: cleaner.rating,
      date: assignment.job.scheduledDate.toLocaleDateString(),
      time: assignment.job.scheduledTime,
      total: assignment.job.quoteAmount,
    }).catch((e) => console.error('client notify failed', e));
    return NextResponse.json({ success: true, status: 'accepted' });
  }

  if (action === 'decline') {
    await prisma.jobAssignment.update({ where: { id: assignmentId }, data: { status: 'rejected' } });
    await prisma.job.update({ where: { id: assignment.jobId }, data: { status: 'quoted' } });
    return NextResponse.json({ success: true, status: 'declined' });
  }

  if (action === 'complete') {
    const hours = typeof actualHours === 'number' ? actualHours : assignment.job.estimatedHours;

    // Time overrun → hold for client approval (mirrors /api/jobs/complete).
    if (hours > assignment.job.estimatedHours) {
      const overageHours = hours - assignment.job.estimatedHours;
      const additionalCharge = parseFloat((overageHours * cleaner.hourlyRate).toFixed(2));
      await prisma.paymentHold.create({
        data: {
          assignmentId,
          reason: 'time_overrun',
          estimatedHours: assignment.job.estimatedHours,
          actualHours: hours,
          additionalCharge,
        },
      });
      await prisma.jobAssignment.update({
        where: { id: assignmentId },
        data: { onHold: true, holdReason: `Ran ${overageHours.toFixed(1)}h over. +$${additionalCharge.toFixed(2)}`, actualHours: hours },
      });
      notifyUser(assignment.job.client.email, assignment.job.client.phone, 'approval_needed', {
        address: assignment.job.client.address,
        estimatedHours: assignment.job.estimatedHours,
        actualHours: hours,
        additionalCharge,
        overageHours: overageHours.toFixed(1),
        jobId: assignment.jobId,
      }).catch((e) => console.error('hold notify failed', e));
      return NextResponse.json({ success: true, onHold: true, additionalCharge });
    }

    await prisma.jobAssignment.update({ where: { id: assignmentId }, data: { actualHours: hours, status: 'completed' } });
    await prisma.job.update({ where: { id: assignment.jobId }, data: { status: 'completed' } });
    const balance = await chargeJobBalance(assignment.jobId);
    if (assignment.job.planId) {
      generateNextVisit(assignment.job.planId).catch((e) => console.error('Next visit generation failed:', e));
    }
    return NextResponse.json({ success: true, onHold: false, balance });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
