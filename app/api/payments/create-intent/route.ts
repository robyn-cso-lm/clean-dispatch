import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, amount, clientEmail } = body;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { client: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Create or reuse Stripe customer
    let stripeCustomerId = job.client.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: clientEmail ?? job.client.email,
        name: job.client.name,
        phone: job.client.phone,
        metadata: { clientId: job.clientId },
      });
      stripeCustomerId = customer.id;

      await prisma.client.update({
        where: { id: job.clientId },
        data: { stripeCustomerId },
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      customer: stripeCustomerId,
      metadata: { jobId },
    });

    await prisma.payment.create({
      data: {
        jobId,
        clientId: job.clientId,
        amount,
        stripePaymentIntentId: paymentIntent.id,
        status: 'pending',
      },
    });

    return NextResponse.json(
      { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment intent error:', error);
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}
