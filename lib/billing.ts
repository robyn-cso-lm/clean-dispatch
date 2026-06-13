import Stripe from 'stripe';
import { prisma } from './prisma';
import { notifyUser } from './notifications';
import { sendMail } from './graphMail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

type JobWithClientPayments = {
  id: string;
  quoteAmount: number;
  depositAmount: number | null;
  tipAmount: number;
  scheduledDate: Date;
  clientId: string;
  client: { name: string; email: string; phone: string; stripeCustomerId: string | null; stripePaymentMethodId: string | null };
  payments: { kind: string; status: string; amount: number; stripePaymentIntentId: string }[];
};

// Find a reusable payment method: prefer the one saved on the client, else
// recover it from the deposit PaymentIntent.
async function resolvePaymentMethod(job: JobWithClientPayments): Promise<string | undefined> {
  if (job.client.stripePaymentMethodId) return job.client.stripePaymentMethodId;
  const deposit = job.payments.find((p) => p.kind === 'deposit');
  if (!deposit) return undefined;
  try {
    const pi = await stripe.paymentIntents.retrieve(deposit.stripePaymentIntentId);
    return (pi.payment_method as string) ?? undefined;
  } catch {
    return undefined;
  }
}

async function loadJob(jobId: string): Promise<JobWithClientPayments | null> {
  return prisma.job.findUnique({
    where: { id: jobId },
    include: { client: true, payments: true },
  }) as unknown as Promise<JobWithClientPayments | null>;
}

async function alertChargeFailure(job: JobWithClientPayments, amount: number, what: string, message: string) {
  sendMail(
    job.client.email,
    'Payment issue with your cleaning',
    `<p>Hi ${job.client.name.split(' ')[0]},</p>
     <p>We tried to charge ${what} of $${amount.toFixed(2)} to your card on file but it didn't go through.</p>
     <p>Please reply and we'll send a secure payment link.</p>`
  ).catch(() => {});
  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.MAIL_FROM;
  if (adminEmail) {
    sendMail(adminEmail, `Charge failed — ${job.client.name} ($${amount.toFixed(2)})`,
      `<p>${what} charge failed for job ${job.id}: ${message}</p>`).catch(() => {});
  }
}

/**
 * Charge the remaining balance for a completed job to the saved card
 * (off-session). Never throws; logs + records failures.
 */
export async function chargeJobBalance(jobId: string): Promise<{
  status: 'charged' | 'skipped' | 'failed' | 'action_required';
  amount?: number;
  reason?: string;
}> {
  const job = await loadJob(jobId);
  if (!job) return { status: 'skipped', reason: 'job not found' };

  if (job.payments.some((p) => p.kind === 'balance' && p.status === 'succeeded')) {
    return { status: 'skipped', reason: 'balance already paid' };
  }

  const deposit = job.payments.find((p) => p.kind === 'deposit');
  const depositPaid = deposit?.amount ?? job.depositAmount ?? 0;
  const balance = Math.round((job.quoteAmount - depositPaid) * 100) / 100;
  if (balance <= 0) return { status: 'skipped', reason: 'no balance due' };
  if (!job.client.stripeCustomerId) return { status: 'skipped', reason: 'no saved customer' };

  const paymentMethodId = await resolvePaymentMethod(job);

  try {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(balance * 100),
      currency: 'usd',
      customer: job.client.stripeCustomerId,
      ...(paymentMethodId ? { payment_method: paymentMethodId } : {}),
      off_session: true,
      confirm: true,
      metadata: { jobId, type: 'balance' },
    });

    await prisma.payment.create({
      data: {
        jobId, clientId: job.clientId, amount: balance, kind: 'balance',
        stripePaymentIntentId: intent.id,
        status: intent.status === 'succeeded' ? 'succeeded' : 'pending',
      },
    });

    if (intent.status === 'succeeded') {
      notifyUser(job.client.email, job.client.phone, 'payment_received', {
        amount: balance, date: job.scheduledDate.toLocaleDateString(),
      }).catch(() => {});
      return { status: 'charged', amount: balance };
    }
    return { status: 'action_required', amount: balance };
  } catch (err) {
    const e = err as { message?: string; payment_intent?: { id?: string } };
    const message = e.message ?? 'charge failed';
    console.error(`Balance charge failed for job ${jobId}:`, message);
    if (e.payment_intent?.id) {
      await prisma.payment.create({
        data: { jobId, clientId: job.clientId, amount: balance, kind: 'balance', stripePaymentIntentId: e.payment_intent.id, status: 'failed' },
      }).catch(() => {});
    }
    await alertChargeFailure(job, balance, 'the remaining balance', message);
    return { status: 'failed', amount: balance, reason: message };
  }
}

/**
 * Auto-charge the deposit (+ tip) for a recurring visit to the saved card.
 * Used when generating subsequent visits — the client isn't present.
 */
export async function chargeRecurringDeposit(jobId: string): Promise<{ ok: boolean; reason?: string }> {
  const job = await loadJob(jobId);
  if (!job) return { ok: false, reason: 'job not found' };
  if (!job.client.stripeCustomerId) return { ok: false, reason: 'no saved customer' };

  const amount = Math.round(((job.depositAmount ?? 0) + (job.tipAmount ?? 0)) * 100) / 100;
  if (amount <= 0) return { ok: true };

  const paymentMethodId = await resolvePaymentMethod(job);
  if (!paymentMethodId) return { ok: false, reason: 'no saved card' };

  try {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      customer: job.client.stripeCustomerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      metadata: { jobId, type: 'deposit' },
    });
    await prisma.payment.create({
      data: {
        jobId, clientId: job.clientId, amount, kind: 'deposit',
        stripePaymentIntentId: intent.id,
        status: intent.status === 'succeeded' ? 'succeeded' : 'pending',
      },
    });
    if (intent.status === 'succeeded') {
      await prisma.job.update({ where: { id: jobId }, data: { status: 'paid' } });
      return { ok: true };
    }
    return { ok: false, reason: intent.status };
  } catch (err) {
    const e = err as { message?: string; payment_intent?: { id?: string } };
    console.error(`Recurring deposit charge failed for job ${jobId}:`, e.message);
    await alertChargeFailure(job, amount, 'the deposit for your recurring clean', e.message ?? 'charge failed');
    return { ok: false, reason: e.message };
  }
}
