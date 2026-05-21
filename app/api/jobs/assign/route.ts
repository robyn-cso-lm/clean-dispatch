import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyUser } from '@/lib/notifications';

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

    const dayOfWeek = job.scheduledDate.getDay();

    const availableCleaner = await prisma.cleaner.findFirst({
      where: {
        backgroundCheckStatus: 'approved',
        availability: {
          some: {
            dayOfWeek,
            isAvailable: true,
            startTime: { lte: job.scheduledTime },
            endTime: { gte: job.scheduledTime },
          },
        },
        // Exclude cleaners already assigned on the same date
        jobs: {
          none: {
            job: {
              scheduledDate: job.scheduledDate,
              status: { in: ['assigned', 'accepted'] },
            },
          },
        },
      },
      orderBy: { rating: 'desc' },
    });

    if (!availableCleaner) {
      return NextResponse.json(
        { error: 'No available cleaners for this slot. An admin will assign manually.', fallback: true },
        { status: 202 }
      );
    }

    const assignment = await prisma.jobAssignment.create({
      data: { jobId, cleanerId: availableCleaner.id, status: 'pending' },
    });

    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'assigned' },
    });

    notifyUser(
      availableCleaner.email,
      availableCleaner.phone,
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

    return NextResponse.json(
      { success: true, assignmentId: assignment.id, cleanerId: availableCleaner.id, message: 'Job assigned to cleaner' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Job assignment error:', error);
    return NextResponse.json({ error: 'Failed to assign job' }, { status: 500 });
  }
}
