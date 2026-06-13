import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { calculateQuote, type QuoteRequest } from '@/lib/quoteCalculator';
import { getAvailableSlots } from '@/lib/scheduling';

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
    } = body;

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

    const job = await prisma.job.create({
      data: {
        clientId: client.id,
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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(depositAmount * 100),
      currency: 'usd',
      customer: stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      metadata: { jobId: job.id, type: 'deposit' },
    });

    await prisma.payment.create({
      data: {
        jobId: job.id,
        clientId: client.id,
        amount: depositAmount,
        stripePaymentIntentId: paymentIntent.id,
        status: 'pending',
      },
    });

    return NextResponse.json(
      {
        jobId: job.id,
        clientSecret: paymentIntent.client_secret,
        depositAmount,
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
