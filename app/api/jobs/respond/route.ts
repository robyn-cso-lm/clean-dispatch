import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyUser } from '@/lib/notifications';

// Cleaner accepts or declines a job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignmentId, response } = body; // response: 'accepted' | 'declined'

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

    if (response === 'accepted') {
      await prisma.jobAssignment.update({
        where: { id: assignmentId },
        data: { status: 'accepted' },
      });

      await prisma.job.update({
        where: { id: assignment.jobId },
        data: { status: 'accepted' },
      });

      notifyUser(
        assignment.job.client.email,
        assignment.job.client.phone,
        'job_accepted',
        {
          cleanerName: assignment.cleaner.name,
          cleanerRating: assignment.cleaner.rating,
          date: assignment.job.scheduledDate.toLocaleDateString(),
          time: assignment.job.scheduledTime,
          total: assignment.job.quoteAmount,
        }
      ).catch(err => console.error('Client notification failed:', err));
    } else if (response === 'declined') {
      await prisma.jobAssignment.update({
        where: { id: assignmentId },
        data: { status: 'rejected' },
      });
      // Job reverts to 'assigned' status — admin re-runs /api/jobs/assign to find next cleaner
      await prisma.job.update({
        where: { id: assignment.jobId },
        data: { status: 'quoted' },
      });
    }

    return NextResponse.json(
      { success: true, status: response, message: `Job ${response} by cleaner` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Job response error:', error);
    return NextResponse.json({ error: 'Failed to process response' }, { status: 500 });
  }
}
