import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle payment success
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const jobId = paymentIntent.metadata.jobId;

    // In production:
    // 1. Update payment status to 'succeeded'
    // 2. Update job status to 'accepted'
    // 3. Trigger auto-assignment
    // 4. Send confirmation email to client

    // await prisma.payment.update({
    //   where: { stripePaymentIntentId: paymentIntent.id },
    //   data: { status: 'succeeded' }
    // });

    // await triggerJobAssignment(jobId);

    console.log(`Payment succeeded for job ${jobId}`);
  }

  // Handle payment failure
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const jobId = paymentIntent.metadata.jobId;

    // In production:
    // Update payment status to 'failed'
    // Send error notification to client

    console.log(`Payment failed for job ${jobId}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
