import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignmentId, actualHours } = body;

    // In production:
    // 1. Get assignment with job details
    // const assignment = await prisma.jobAssignment.findUnique({
    //   where: { id: assignmentId },
    //   include: {
    //     job: { include: { client: true } },
    //     cleaner: true
    //   }
    // });

    // const estimatedHours = assignment.job.estimatedHours;
    // const cleaner = assignment.cleaner;

    // // Check if job ran over
    // if (actualHours > estimatedHours) {
    //   const overageHours = actualHours - estimatedHours;
    //   const additionalCharge = overageHours * cleaner.hourlyRate;

    //   // Create payment hold
    //   const hold = await prisma.paymentHold.create({
    //     data: {
    //       assignmentId,
    //       reason: 'time_overrun',
    //       estimatedHours,
    //       actualHours,
    //       additionalCharge
    //     }
    //   });

    //   // Update assignment to mark as on hold
    //   await prisma.jobAssignment.update({
    //     where: { id: assignmentId },
    //     data: {
    //       onHold: true,
    //       holdReason: `Job ran ${overageHours.toFixed(1)}h over estimate. Additional charge: $${additionalCharge.toFixed(2)}`,
    //       actualHours
    //     }
    //   });

    //   // Send approval request to client via email/SMS
    //   // await sendApprovalRequestToClient(
    //   //   assignment.job.client,
    //   //   additionalCharge,
    //   //   overageHours,
    //   //   assignment.id
    //   // );

    //   return NextResponse.json(
    //     {
    //       onHold: true,
    //       overageHours: overageHours.toFixed(1),
    //       additionalCharge: additionalCharge.toFixed(2),
    //       message: 'Job held pending client approval for additional charges'
    //     },
    //     { status: 200 }
    //   );
    // }

    // Job completed within estimate - release payment
    // await prisma.jobAssignment.update({
    //   where: { id: assignmentId },
    //   data: { actualHours }
    // });

    return NextResponse.json(
      {
        success: true,
        onHold: false,
        message: 'Job completed. Payment released to cleaner.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Job completion error:', error);
    return NextResponse.json(
      { error: 'Failed to process job completion' },
      { status: 500 }
    );
  }
}
