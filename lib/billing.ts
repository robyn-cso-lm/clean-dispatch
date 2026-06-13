import Stripe from 'stripe';
import { prisma } from './prisma';
import { notifyUser } from './notifications';
import { sendMail } from './graphMail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

/**
 * Charge the remaining balance for a completed job to the card used for the
 * deposit (off-session). The deposit PaymentIntent is created with
 * setup_future_usage:'off_session', so its payment method is reusable.
 *
 * Returns a summary; never throws (logs + records failures so completion isn't
 * blocked). If the off-session charge needs authentication or is declined, the
 * client is emailed and admin is alerted instead.
 */
export async function chargeJobBalance(jobId: string): Promise<{
  status: 'charged' | 'skipped' | 'failed' | 'action_required';
  amount?: number;
  reason?: string;
}> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { client: true, payments: true },
  });
  if (!job) return { status: 'skipped', reason: 'job not found' };

  // Already has a succeeded balance payment? Don't double-charge.
  if (job.payments.some((p) => p.kind === 'balance' && p.status === 'succeeded')) {
    return { status: 'skipped', reason: 'balance already paid' };
  }

  const deposit = job.payments.find((p) => p.kind === 'deposit');
  const depositPaid = deposit?.amount ?? job.depositAmount ?? 0;
  const balance = Math.round((job.quoteAmount - depositPaid) * 100) / 100;
  if (balance <= 0) return { status: 'skipped', reason: 'no balance due' };

  if (!job.client.stripeCustomerId || !deposit) {
    return { status: 'skipped', reason: 'no saved customer/deposit' };
  }

  // Recover the payment method saved on the deposit.
  let paymentMethodId: string | undefined;
  try {
    const depositPI = await stripe.paymentIntents.retrieve(deposit.stripePaymentIntentId);
    paymentMethodId = (depositPI.payment_method as string) ?? undefined;
  } catch (err) {
    console.error('Could not retrieve deposit PI for balance charge:', err);
  }

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
        jobId,
        clientId: job.clientId,
        amount: balance,
        kind: 'balance',
        stripePaymentIntentId: intent.id,
        status: intent.status === 'succeeded' ? 'succeeded' : 'pending',
      },
    });

    if (intent.status === 'succeeded') {
      notifyUser(job.client.email, job.client.phone, 'payment_received', {
        amount: balance,
        date: job.scheduledDate.toLocaleDateString(),
      }).catch((e) => console.error('Balance receipt notify failed:', e));
      return { status: 'charged', amount: balance };
    }
    return { status: 'action_required', amount: balance };
  } catch (err) {
    // Card declined or authentication required for off-session charge.
    const e = err as { message?: string; payment_intent?: { id?: string } };
    const message = e.message ?? 'charge failed';
    console.error(`Balance charge failed for job ${jobId}:`, message);

    // Record the failed attempt if we have a PI id from the error.
    const piId = e.payment_intent?.id;
    if (piId) {
      await prisma.payment
        .create({
          data: {
            jobId,
            clientId: job.clientId,
            amount: balance,
            kind: 'balance',
            stripePaymentIntentId: piId,
            status: 'failed',
          },
        })
        .catch(() => {});
    }

    // Let the client + admin know the balance still needs paying.
    sendMail(
      job.client.email,
      'Your cleaning is complete — balance due',
      `<p>Hi ${job.client.name.split(' ')[0]},</p>
       <p>Your clean is done! We tried to charge the remaining balance of $${balance.toFixed(2)} to your card on file but it didn't go through.</p>
       <p>Please reply to this email and we'll send a secure payment link.</p>`
    ).catch(() => {});
    const adminEmail = process.env.ADMIN_EMAIL ?? process.env.MAIL_FROM;
    if (adminEmail) {
      sendMail(
        adminEmail,
        `Balance charge failed — ${job.client.name} ($${balance.toFixed(2)})`,
        `<p>Off-session balance charge failed for job ${jobId}: ${message}</p>`
      ).catch(() => {});
    }
    return { status: 'failed', amount: balance, reason: message };
  }
}
