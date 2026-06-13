import { prisma } from './prisma';
import { calculateQuote, type QuoteRequest } from './quoteCalculator';
import { chargeRecurringDeposit } from './billing';
import { findAvailableCleanerId } from './scheduling';
import { notifyUser } from './notifications';

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function nextDateFor(date: Date, frequency: string): Date {
  if (frequency === 'weekly') return addDays(date, 7);
  if (frequency === 'biweekly') return addDays(date, 14);
  if (frequency === 'monthly') {
    const d = new Date(date);
    d.setUTCMonth(d.getUTCMonth() + 1);
    return d;
  }
  return addDays(date, 7);
}

const depositPercent = () => parseFloat(process.env.BOOKING_DEPOSIT_PERCENT ?? '50');

/**
 * Create the next visit for an active recurring plan: build the job, auto-charge
 * the deposit to the saved card, then assign a cleaner (preferring the plan's
 * preferred cleaner). Returns the new job id, or null if skipped.
 */
export async function generateNextVisit(planId: string): Promise<string | null> {
  const plan = await prisma.recurringPlan.findUnique({ where: { id: planId } });
  if (!plan || plan.status !== 'active') return null;

  // Don't create a duplicate if an unfinished visit already exists for this plan.
  const openVisit = await prisma.job.findFirst({
    where: { planId, status: { in: ['quoted', 'paid', 'assigned', 'accepted'] } },
  });
  if (openVisit) return null;

  const addOns = plan.addOns ? plan.addOns.split(',').filter(Boolean) : [];
  const quote = calculateQuote({
    serviceType: plan.serviceType as QuoteRequest['serviceType'],
    squareFeet: plan.squareFeet,
    bedrooms: plan.bedrooms,
    bathrooms: plan.bathrooms,
    addOns,
  });
  const depositAmount = Math.round(quote.totalQuote * (depositPercent() / 100) * 100) / 100;

  const job = await prisma.job.create({
    data: {
      clientId: plan.clientId,
      planId: plan.id,
      serviceType: plan.serviceType,
      squareFeet: plan.squareFeet,
      bedrooms: plan.bedrooms,
      bathrooms: plan.bathrooms,
      specialRequests: plan.specialRequests,
      estimatedHours: quote.hoursEstimate,
      quoteAmount: quote.totalQuote,
      depositAmount,
      tipAmount: plan.tipAmount,
      scheduledDate: plan.nextDate,
      scheduledTime: plan.scheduledTime,
      status: 'quoted',
    },
  });

  // Advance the plan's next date regardless of charge outcome.
  await prisma.recurringPlan.update({
    where: { id: plan.id },
    data: { nextDate: nextDateFor(plan.nextDate, plan.frequency) },
  });

  // Auto-charge the deposit to the card on file.
  const charge = await chargeRecurringDeposit(job.id);
  if (!charge.ok) {
    // Leave the job as 'quoted' for manual follow-up; client/admin already alerted.
    return job.id;
  }

  // Assign: prefer the plan's cleaner if they're free, else best available.
  let cleanerId: string | null = null;
  if (plan.preferredCleanerId) {
    const free = await findAvailableCleanerId(job.scheduledDate, job.scheduledTime, job.estimatedHours);
    // Use preferred only if they're among the free cleaners.
    if (free) {
      const preferredFree = await prisma.cleaner.findFirst({
        where: { id: plan.preferredCleanerId, backgroundCheckStatus: 'approved' },
      });
      cleanerId = preferredFree ? plan.preferredCleanerId : free;
    }
  } else {
    cleanerId = await findAvailableCleanerId(job.scheduledDate, job.scheduledTime, job.estimatedHours);
  }

  if (cleanerId) {
    await prisma.jobAssignment.create({ data: { jobId: job.id, cleanerId, status: 'pending' } });
    await prisma.job.update({ where: { id: job.id }, data: { status: 'assigned' } });
    const cleaner = await prisma.cleaner.findUnique({ where: { id: cleanerId } });
    const client = await prisma.client.findUnique({ where: { id: plan.clientId } });
    if (cleaner && client) {
      notifyUser(cleaner.email, cleaner.phone, 'job_assigned', {
        serviceType: job.serviceType,
        clientName: client.name,
        address: client.address,
        date: job.scheduledDate.toLocaleDateString(),
        time: job.scheduledTime,
        estimatedHours: job.estimatedHours,
        total: job.quoteAmount,
      }).catch(() => {});
    }
  }

  return job.id;
}
