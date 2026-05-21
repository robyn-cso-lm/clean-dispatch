import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, amount, clientEmail } = body;

    // Create or retrieve customer
    const customerList = await stripe.customers.list({ email: clientEmail, limit: 1 });
    let customerId = customerList.data[0]?.id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: clientEmail,
        metadata: { jobId },
      });
      customerId = customer.id;
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      metadata: {
        jobId,
      },
    });

    // In production, save payment intent to database
    // await prisma.payment.create({
    //   data: {
    //     jobId,
    //     amount,
    //     stripePaymentIntentId: paymentIntent.id,
    //     clientId,
    //     status: 'pending'
    //   }
    // });

    return NextResponse.json(
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
