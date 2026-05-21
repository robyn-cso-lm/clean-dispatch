import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyUser } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignmentId, actualHours } = body;

    const assignment = await prisma.jobAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        job: { include: { client: true } },
        cleaner: true,
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const { estimatedHours } = assignment.job;

    if (actualHours > estimatedHours) {
      const overageHours = actualHours - estimatedHours;
      const additionalCharge = parseFloat((overageHours * assignment.cleaner.hourlyRate).toFixed(2));

      await prisma.paymentHold.create({
        data: {
          assignmentId,
          reason: 'time_overrun',
          estimatedHours,
          actualHours,
          additionalCharge,
        },
      });

      await prisma.jobAssignment.update({
        where: { id: assignmentId },
        data: {
          onHold: true,
          holdReason: `Job ran ${overageHours.toFixed(1)}h over estimate. Additional charge: $${additionalCharge.toFixed(2)}`,
          actualHours,
        },
      });

      notifyUser(
        assignment.job.client.email,
        assignment.job.client.phone,
        'approval_needed',
        {
          address: assignment.job.client.address,
          estimatedHours,
          actualHours,
          additionalCharge,
          overageHours: overageHours.toFixed(1),
          jobId: assignment.jobId,
        }
      ).catch(err => console.error('Hold notification failed:', err));

      return NextResponse.json(
        {
          onHold: true,
          overageHours: overageHours.toFixed(1),
          additionalCharge: additionalCharge.toFixed(2),
          message: 'Job held pending client approval for additional charges',
        },
        { status: 200 }
      );
    }

    await prisma.jobAssignment.update({
      where: { id: assignmentId },
      data: { actualHours, status: 'completed' },
    });

    await prisma.job.update({
      where: { id: assignment.jobId },
      data: { status: 'completed' },
    });

    return NextResponse.json(
      { success: true, onHold: false, message: 'Job completed. Payment released to cleaner.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Job completion error:', error);
    return NextResponse.json({ error: 'Failed to process job completion' }, { status: 500 });
  }
}
