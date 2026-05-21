import { NextRequest, NextResponse } from 'next/server';
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
    } = body;

    // Calculate quote
    const quote = calculateQuote({
      serviceType,
      squareFeet,
      bedrooms,
      bathrooms,
      addOns,
    });

    // In production, save to database via Prisma
    // const job = await prisma.job.create({
    //   data: {
    //     clientId,
    //     serviceType,
    //     squareFeet,
    //     bedrooms,
    //     bathrooms,
    //     estimatedHours: quote.hoursEstimate,
    //     quoteAmount: quote.totalQuote,
    //     scheduledDate: new Date(scheduledDate),
    //     scheduledTime,
    //     status: 'quoted',
    //     addOns: {
    //       create: addOns.map((addon: string) => ({
    //         addOn: { connect: { name: addon } }
    //       }))
    //     }
    //   },
    // });

    return NextResponse.json(
      {
        success: true,
        jobId: 'temp-job-id',
        quote: quote.totalQuote,
        hoursEstimate: quote.hoursEstimate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Job creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}
