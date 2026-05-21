import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { holdId, clientApproved } = body;

    const hold = await prisma.paymentHold.findUnique({
      where: { id: holdId },
      include: {
        assignment: {
          include: {
            job: { include: { client: true } },
            cleaner: true,
          },
        },
      },
    });

    if (!hold) {
      return NextResponse.json({ error: 'Hold not found' }, { status: 404 });
    }

    if (clientApproved) {
      // Create a new payment intent for the additional charge
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(hold.additionalCharge * 100),
        currency: 'usd',
        customer: hold.assignment.job.client.stripeCustomerId ?? undefined,
        metadata: {
          type: 'additional_charge',
          holdId,
          jobId: hold.assignment.jobId,
        },
      });

      await prisma.paymentHold.update({
        where: { id: holdId },
        data: { clientApproved: true },
      });

      await prisma.jobAssignment.update({
        where: { id: hold.assignmentId },
        data: { onHold: false, holdReason: null },
      });

      // Return clientSecret so frontend can confirm the additional charge
      return NextResponse.json(
        {
          success: true,
          approved: true,
          clientSecret: paymentIntent.client_secret,
          additionalCharge: hold.additionalCharge,
          message: 'Additional charge approved. Complete payment to release.',
        },
        { status: 200 }
      );
    } else {
      await prisma.paymentHold.update({
        where: { id: holdId },
        data: { clientApproved: false },
      });

      await prisma.jobAssignment.update({
        where: { id: hold.assignmentId },
        data: { onHold: false, holdReason: null },
      });

      return NextResponse.json(
        {
          success: true,
          approved: false,
          message: 'Additional charge declined. Cleaner paid for estimated hours only.',
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Hold approval error:', error);
    return NextResponse.json({ error: 'Failed to process hold approval' }, { status: 500 });
  }
}
