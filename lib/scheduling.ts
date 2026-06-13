import { prisma } from './prisma';

// Availability-based scheduling, shared by the public slot picker and the
// post-payment auto-assignment so they never disagree.
//
// All day-of-week / date math is done in UTC to match how jobs are stored
// (`new Date('YYYY-MM-DD')` => UTC midnight). Production runs in UTC.

const SLOT_STEP_MIN = 30;

function openMin(): number {
  return timeToMin(process.env.BOOKING_OPEN_TIME ?? '08:00');
}
function closeMin(): number {
  return timeToMin(process.env.BOOKING_CLOSE_TIME ?? '18:00');
}
function bufferMin(): number {
  return parseInt(process.env.BOOKING_BUFFER_MINUTES ?? '60', 10);
}

export function timeToMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function minToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function durationMinutes(estimatedHours: number): number {
  return Math.ceil(estimatedHours * 60);
}

type CleanerWithSchedule = {
  id: string;
  availability: { startTime: string; endTime: string; isAvailable: boolean }[];
  jobs: { job: { scheduledTime: string; estimatedHours: number } }[];
};

// A cleaner is free for [startMin, endMin) if their availability window covers
// it AND no existing job (padded by the travel buffer on both sides) overlaps.
function cleanerIsFree(cleaner: CleanerWithSchedule, startMin: number, endMin: number): boolean {
  const window = cleaner.availability.find(
    (a) => a.isAvailable && timeToMin(a.startTime) <= startMin && timeToMin(a.endTime) >= endMin
  );
  if (!window) return false;

  const buffer = bufferMin();
  for (const { job } of cleaner.jobs) {
    const jobStart = timeToMin(job.scheduledTime);
    const jobEnd = jobStart + durationMinutes(job.estimatedHours);
    // Overlap test with buffer padding around the existing job.
    if (startMin < jobEnd + buffer && endMin + buffer > jobStart) {
      return false;
    }
  }
  return true;
}

async function loadCleaners(scheduledDate: Date, dayOfWeek: number): Promise<CleanerWithSchedule[]> {
  return prisma.cleaner.findMany({
    where: {
      backgroundCheckStatus: 'approved',
      availability: { some: { dayOfWeek, isAvailable: true } },
    },
    select: {
      id: true,
      availability: {
        where: { dayOfWeek },
        select: { startTime: true, endTime: true, isAvailable: true },
      },
      jobs: {
        where: {
          status: { in: ['pending', 'accepted'] },
          job: { scheduledDate, status: { in: ['assigned', 'accepted', 'paid'] } },
        },
        select: { job: { select: { scheduledTime: true, estimatedHours: true } } },
      },
    },
  });
}

/**
 * Return the bookable start times (e.g. ["09:00","09:30"]) on `dateStr`
 * (YYYY-MM-DD) for a job of the given estimated length — i.e. slots where at
 * least one approved cleaner is available, accounting for the travel buffer.
 */
export async function getAvailableSlots(dateStr: string, estimatedHours: number): Promise<string[]> {
  const scheduledDate = new Date(dateStr);
  if (Number.isNaN(scheduledDate.getTime())) return [];

  const dayOfWeek = scheduledDate.getUTCDay();
  const cleaners = await loadCleaners(scheduledDate, dayOfWeek);
  if (cleaners.length === 0) return [];

  const dur = durationMinutes(estimatedHours);
  const slots: string[] = [];

  for (let start = openMin(); start + dur <= closeMin(); start += SLOT_STEP_MIN) {
    const end = start + dur;
    if (cleaners.some((c) => cleanerIsFree(c, start, end))) {
      slots.push(minToTime(start));
    }
  }
  return slots;
}

/**
 * Pick the best approved cleaner who is genuinely free for this slot (buffer
 * included). Returns the cleaner id, or null if none — in which case the
 * booking should fall back to manual assignment.
 */
export async function findAvailableCleanerId(
  scheduledDate: Date,
  scheduledTime: string,
  estimatedHours: number
): Promise<string | null> {
  const dayOfWeek = scheduledDate.getUTCDay();
  const cleaners = await prisma.cleaner.findMany({
    where: {
      backgroundCheckStatus: 'approved',
      availability: { some: { dayOfWeek, isAvailable: true } },
    },
    orderBy: { rating: 'desc' },
    select: {
      id: true,
      availability: {
        where: { dayOfWeek },
        select: { startTime: true, endTime: true, isAvailable: true },
      },
      jobs: {
        where: {
          status: { in: ['pending', 'accepted'] },
          job: { scheduledDate, status: { in: ['assigned', 'accepted', 'paid'] } },
        },
        select: { job: { select: { scheduledTime: true, estimatedHours: true } } },
      },
    },
  });

  const startMin = timeToMin(scheduledTime);
  const endMin = startMin + durationMinutes(estimatedHours);

  const match = cleaners.find((c) => cleanerIsFree(c, startMin, endMin));
  return match?.id ?? null;
}
