import { NextRequest, NextResponse } from 'next/server';

// This route auto-assigns jobs to available cleaners
// Called when a job is confirmed by a client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, scheduledDate, scheduledTime } = body;

    // In production:
    // 1. Get job details
    // 2. Parse scheduled date/time
    // 3. Find cleaners with matching availability
    // 4. Select closest cleaner (by location)
    // 5. Create JobAssignment with status 'pending'
    // 6. Send notification to cleaner (email/SMS)

    // const job = await prisma.job.findUnique({
    //   where: { id: jobId },
    //   include: { client: true }
    // });

    // Get day of week from scheduledDate
    // const date = new Date(scheduledDate);
    // const dayOfWeek = date.getDay();

    // Find available cleaners
    // const availableCleaner = await prisma.cleaner.findFirst({
    //   where: {
    //     backgroundCheckStatus: 'approved',
    //     availability: {
    //       some: {
    //         dayOfWeek: dayOfWeek,
    //         isAvailable: true,
    //         startTime: { lte: scheduledTime },
    //         endTime: { gte: scheduledTime }
    //       }
    //     }
    //   },
    //   orderBy: {
    //     rating: 'desc',
    //   }
    // });

    // if (!availableCleaner) {
    //   return NextResponse.json(
    //     { error: 'No available cleaners', fallback: true },
    //     { status: 202 }
    //   );
    // }

    // Create assignment
    // const assignment = await prisma.jobAssignment.create({
    //   data: {
    //     jobId,
    //     cleanerId: availableCleaner.id,
    //     status: 'pending'
    //   }
    // });

    // // Update job status
    // await prisma.job.update({
    //   where: { id: jobId },
    //   data: { status: 'assigned' }
    // });

    return NextResponse.json(
      {
        success: true,
        assignmentId: 'temp-assignment-id',
        cleanerId: 'temp-cleaner-id',
        message: 'Job assigned to cleaner',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Job assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to assign job' },
      { status: 500 }
    );
  }
}
