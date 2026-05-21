import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { notifyUser } from '@/lib/notifications';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    console.error('Webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const { jobId, type } = paymentIntent.metadata;

    if (type === 'additional_charge') {
      // Additional charge for a time overrun — nothing more to do
      console.log(`Additional charge succeeded for job ${jobId}`);
      return NextResponse.json({ received: true });
    }

    // Normal job payment
    await prisma.payment.update({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: { status: 'succeeded' },
    });

    const job = await prisma.job.update({
      where: { id: jobId },
      data: { status: 'paid' },
      include: { client: true },
    });

    // Notify client and trigger auto-assignment
    notifyUser(
      job.client.email,
      job.client.phone,
      'payment_received',
      { amount: job.quoteAmount, date: job.scheduledDate.toLocaleDateString() }
    ).catch(err => console.error('Payment confirmation notification failed:', err));

    // Auto-assign a cleaner
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

    if (availableCleaner) {
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
      ).catch(err => console.error('Cleaner assignment notification failed:', err));

      console.log(`Job ${jobId} auto-assigned to cleaner ${availableCleaner.id} (assignment ${assignment.id})`);
    } else {
      console.log(`Job ${jobId} paid but no cleaner available — needs manual assignment`);
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const { jobId } = paymentIntent.metadata;

    await prisma.payment.update({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: { status: 'failed' },
    }).catch((err: unknown) => console.error('Failed to update payment status:', err));

    console.log(`Payment failed for job ${jobId}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
