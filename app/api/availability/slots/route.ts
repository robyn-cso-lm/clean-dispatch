import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/scheduling';

// GET /api/availability/slots?date=YYYY-MM-DD&hours=3.5
// Returns the start times bookable on that date for a job of the given length.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const hours = parseFloat(searchParams.get('hours') ?? '');

  if (!date || Number.isNaN(hours) || hours <= 0) {
    return NextResponse.json({ error: 'date and hours are required.' }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots(date, hours);
    return NextResponse.json({ slots });
  } catch (err) {
    console.error('Slot lookup error:', err);
    return NextResponse.json({ error: 'Failed to load availability.' }, { status: 500 });
  }
}
