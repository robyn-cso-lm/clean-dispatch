import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyUser } from '@/lib/notifications';
import { findAvailableCleanerId } from '@/lib/scheduling';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId } = body;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { client: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const cleanerId = await findAvailableCleanerId(
      job.scheduledDate,
      job.scheduledTime,
      job.estimatedHours
    );

    if (!cleanerId) {
      return NextResponse.json(
        { error: 'No available cleaners for this slot. An admin will assign manually.', fallback: true },
        { status: 202 }
      );
    }

    const cleaner = await prisma.cleaner.findUnique({ where: { id: cleanerId } });

    const assignment = await prisma.jobAssignment.create({
      data: { jobId, cleanerId, status: 'pending' },
    });

    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'assigned' },
    });

    if (cleaner) {
      notifyUser(
        cleaner.email,
        cleaner.phone,
        'job_assigned',
        {
          serviceType: job.serviceType,
          clientName: job.client.name,
          address: job.client.address,
          date: job.scheduledDate.toLocaleDateString(),
          time: job.scheduledTime,
          estimatedHours: job.estimatedHours,
          total: job.quoteAmount,
        }
      ).catch(err => console.error('Cleaner notification failed:', err));
    }

    return NextResponse.json(
      { success: true, assignmentId: assignment.id, cleanerId, message: 'Job assigned to cleaner' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Job assignment error:', error);
    return NextResponse.json({ error: 'Failed to assign job' }, { status: 500 });
  }
}
