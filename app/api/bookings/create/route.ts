import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { calculateQuote, type QuoteRequest } from '@/lib/quoteCalculator';
import { getAvailableSlots } from '@/lib/scheduling';
import { nextDateFor } from '@/lib/recurring';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// One-shot booking: upsert client, create job, take a deposit via Stripe.
// The remaining balance is billed on completion. Cleaner auto-assignment
// happens in the Stripe webhook once the deposit succeeds.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contact, // { name, email, phone, address, city, county, zipCode }
      serviceType,
      squareFeet,
      bedrooms,
      bathrooms,
      addOns = [],
      scheduledDate,
      scheduledTime,
      specialRequests,
      frequency = 'one-time', // one-time | weekly | biweekly | monthly
      tipAmount = 0,
    } = body;

    const tip = Math.max(0, Math.round((Number(tipAmount) || 0) * 100) / 100);
    const isRecurring = ['weekly', 'biweekly', 'monthly'].includes(frequency);

    if (!contact?.name || !contact?.email || !contact?.phone || !contact?.address) {
      return NextResponse.json({ error: 'Name, email, phone and address are required.' }, { status: 400 });
    }
    if (!scheduledDate || !scheduledTime) {
      return NextResponse.json({ error: 'Please choose a date and time.' }, { status: 400 });
    }

    const quote = calculateQuote({
      serviceType: serviceType as QuoteRequest['serviceType'],
      squareFeet: parseInt(squareFeet, 10),
      bedrooms: parseInt(bedrooms, 10),
      bathrooms: parseInt(bathrooms, 10),
      addOns,
    });

    // Re-validate the slot server-side so a stale page can't book an
    // unavailable time.
    const slots = await getAvailableSlots(scheduledDate, quote.hoursEstimate);
    if (!slots.includes(scheduledTime)) {
      return NextResponse.json(
        { error: 'That time is no longer available. Please pick another slot.', slots },
        { status: 409 }
      );
    }

    const client = await prisma.client.upsert({
      where: { email: contact.email },
      update: {
        name: contact.name,
        phone: contact.phone,
        address: contact.address,
        city: contact.city ?? '',
        county: contact.county ?? '',
        zipCode: contact.zipCode ?? '',
      },
      create: {
        email: contact.email,
        name: contact.name,
        phone: contact.phone,
        address: contact.address,
        city: contact.city ?? '',
        county: contact.county ?? '',
        zipCode: contact.zipCode ?? '',
      },
    });

    const depositPercent = parseFloat(process.env.BOOKING_DEPOSIT_PERCENT ?? '50');
    const depositAmount = Math.round(quote.totalQuote * (depositPercent / 100) * 100) / 100;

    // Create the recurring plan first (if chosen) so the first visit links to it.
    let planId: string | undefined;
    if (isRecurring) {
      const plan = await prisma.recurringPlan.create({
        data: {
          clientId: client.id,
          serviceType,
          squareFeet: parseInt(squareFeet, 10),
          bedrooms: parseInt(bedrooms, 10),
          bathrooms: parseInt(bathrooms, 10),
          addOns: addOns?.length ? addOns.join(',') : null,
          specialRequests: specialRequests || null,
          frequency,
          scheduledTime,
          tipAmount: tip,
          // First visit is `scheduledDate`; the plan tracks the NEXT one.
          nextDate: nextDateFor(new Date(scheduledDate), frequency),
        },
      });
      planId = plan.id;
    }

    const job = await prisma.job.create({
      data: {
        clientId: client.id,
        planId,
        serviceType,
        squareFeet: parseInt(squareFeet, 10),
        bedrooms: parseInt(bedrooms, 10),
        bathrooms: parseInt(bathrooms, 10),
        specialRequests:
          [specialRequests, addOns?.length ? `Add-ons: ${addOns.join(', ')}` : null]
            .filter(Boolean)
            .join(' | ') || null,
        estimatedHours: quote.hoursEstimate,
        quoteAmount: quote.totalQuote,
        depositAmount,
        tipAmount: tip,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        status: 'quoted',
      },
    });

    // Stripe customer
    let stripeCustomerId = client.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: client.email,
        name: client.name,
        phone: client.phone,
        metadata: { clientId: client.id },
      });
      stripeCustomerId = customer.id;
      await prisma.client.update({ where: { id: client.id }, data: { stripeCustomerId } });
    }

    // Charge the deposit now, plus any tip (100% of which goes to the cleaner).
    const dueNow = Math.round((depositAmount + tip) * 100) / 100;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(dueNow * 100),
      currency: 'usd',
      customer: stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      // Save the card so we can auto-charge the balance + future visits.
      setup_future_usage: 'off_session',
      metadata: { jobId: job.id, type: 'deposit' },
    });

    await prisma.payment.create({
      data: {
        jobId: job.id,
        clientId: client.id,
        amount: depositAmount, // deposit portion only; tip tracked on the job
        kind: 'deposit',
        stripePaymentIntentId: paymentIntent.id,
        status: 'pending',
      },
    });

    return NextResponse.json(
      {
        jobId: job.id,
        clientSecret: paymentIntent.client_secret,
        depositAmount,
        tipAmount: tip,
        dueNow,
        recurring: isRecurring ? frequency : null,
        totalQuote: quote.totalQuote,
        balanceDue: Math.round((quote.totalQuote - depositAmount) * 100) / 100,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json({ error: 'Failed to create booking.' }, { status: 500 });
  }
}
