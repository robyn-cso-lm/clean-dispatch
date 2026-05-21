import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateQuote } from '@/lib/quoteCalculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientId,
      serviceType,
      squareFeet,
      bedrooms,
      bathrooms,
      addOns,
      scheduledDate,
      scheduledTime,
      specialRequests,
    } = body;

    const quote = calculateQuote({ serviceType, squareFeet, bedrooms, bathrooms, addOns });

    // addOns are priced into quoteAmount. JobAddOn relation requires seeded AddOn records —
    // skip for MVP, add-on details are captured in specialRequests if needed.
    const job = await prisma.job.create({
      data: {
        clientId,
        serviceType,
        squareFeet: parseInt(squareFeet),
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        specialRequests: [specialRequests, addOns?.join(', ')].filter(Boolean).join(' | ') || null,
        estimatedHours: quote.hoursEstimate,
        quoteAmount: quote.totalQuote,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        status: 'quoted',
      },
    });

    return NextResponse.json(
      { success: true, jobId: job.id, quote: quote.totalQuote, hoursEstimate: quote.hoursEstimate },
      { status: 201 }
    );
  } catch (error) {
    console.error('Job creation error:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
