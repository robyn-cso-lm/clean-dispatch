import { NextRequest, NextResponse } from 'next/server';

// Cleaner accepts or declines a job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignmentId, cleanerId, response } = body; // response: 'accepted' | 'declined'

    // In production:
    // const assignment = await prisma.jobAssignment.findUnique({
    //   where: { id: assignmentId },
    //   include: { job: { include: { client: true } } }
    // });

    // if (response === 'accepted') {
    //   // Update assignment
    //   await prisma.jobAssignment.update({
    //     where: { id: assignmentId },
    //     data: { status: 'accepted' }
    //   });

    //   // Update job status
    //   await prisma.job.update({
    //     where: { id: assignment.jobId },
    //     data: { status: 'accepted' }
    //   });

    //   // Send confirmation to client (email)
    //   // sendEmailToClient(assignment.job.client, 'Your cleaning is confirmed!');
    // } else if (response === 'declined') {
    //   // Mark assignment as rejected
    //   await prisma.jobAssignment.update({
    //     where: { id: assignmentId },
    //     data: { status: 'rejected' }
    //   });

    //   // Try to assign to next available cleaner
    //   // triggerJobReassignment(assignment.jobId);
    // }

    return NextResponse.json(
      {
        success: true,
        status: response,
        message: `Job ${response} by cleaner`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Job response error:', error);
    return NextResponse.json(
      { error: 'Failed to process response' },
      { status: 500 }
    );
  }
}
