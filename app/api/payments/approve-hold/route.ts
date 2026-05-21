import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { holdId, clientApproved } = body;

    // In production:
    // 1. Get payment hold
    // const hold = await prisma.paymentHold.findUnique({
    //   where: { id: holdId },
    //   include: {
    //     assignment: {
    //       include: {
    //         job: { include: { client: true, payment: true } },
    //         cleaner: true
    //       }
    //     }
    //   }
    // });

    // if (clientApproved) {
    //   // Charge client additional amount
    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount: Math.round(hold.additionalCharge * 100),
    //     currency: 'usd',
    //     customer: hold.assignment.job.payment.stripeCustomerId,
    //     metadata: {
    //       type: 'additional_charge',
    //       holdId,
    //       jobId: hold.assignment.jobId
    //     }
    //   });

    //   // Update hold as approved
    //   await prisma.paymentHold.update({
    //     where: { id: holdId },
    //     data: {
    //       clientApproved: true
    //     }
    //   });

    //   // Release cleaner payout
    //   await releasecleanerPayout(hold.assignment.cleanerId, hold.additionalCharge);

    //   // Send confirmation to both parties
    //   // await sendApprovalConfirmation(hold.assignment.job.client, hold.assignment.cleaner);
    // } else {
    //   // Client declined - adjust cleaner payout to original estimate only
    //   await adjustCleanerPayoutToEstimate(hold.assignment.cleanerId);

    //   // Send declined notification
    //   // await sendDeclinedNotification(hold.assignment.cleaner);
    // }

    // // Remove hold
    // await prisma.jobAssignment.update({
    //   where: { id: hold.assignmentId },
    //   data: {
    //     onHold: false,
    //     holdReason: null
    //   }
    // });

    return NextResponse.json(
      {
        success: true,
        approved: clientApproved,
        message: clientApproved
          ? 'Additional charge approved. Payment processing.'
          : 'Additional charge declined. Cleaner paid for estimated hours only.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Hold approval error:', error);
    return NextResponse.json(
      { error: 'Failed to process hold approval' },
      { status: 500 }
    );
  }
}
