import { sendMail } from './graphMail';

export async function sendSmsViaQuo(
  to: string,
  message: string
): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.QUO_API_URL}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.QUO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        from: process.env.QUO_FROM_NUMBER,
        body: message,
      }),
    });

    if (!response.ok) {
      console.error('Quo SMS error:', response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('SMS send error:', error);
    return false;
  }
}

// Combined notification (email + SMS)
export async function notifyUser(
  email: string,
  phone: string,
  type: 'job_assigned' | 'approval_needed' | 'payment_received' | 'job_accepted',
  data: Record<string, unknown>
): Promise<void> {
  const templates: Record<string, { subject: string; html: string; sms: string }> = {
    job_assigned: {
      subject: 'New Cleaning Job Available!',
      html: `
        <h2>New Job: ${data.serviceType}</h2>
        <p>Client: ${data.clientName}</p>
        <p>Address: ${data.address}</p>
        <p>Date: ${data.date} at ${data.time}</p>
        <p>Estimated Hours: ${data.estimatedHours}</p>
        <p>Rate: $${data.total}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/cleaner/dashboard">Accept or Decline</a></p>
      `,
      sms: `New job: ${data.serviceType} on ${data.date} at ${data.time}. $${data.total}. Accept/decline on app.`,
    },
    approval_needed: {
      subject: 'Job Overrun - Additional Charge Approval Needed',
      html: `
        <h2>Job Went Over Time</h2>
        <p>Your cleaning at ${data.address} took longer than estimated.</p>
        <p>Estimated: ${data.estimatedHours}h | Actual: ${data.actualHours}h</p>
        <p>Additional Charge: $${data.additionalCharge}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/client/jobs/${data.jobId}/approve">Approve or Deny</a></p>
      `,
      sms: `Job at ${data.address} ran ${data.overageHours}h over. Additional charge: $${data.additionalCharge}. Approve?`,
    },
    payment_received: {
      subject: 'Payment Received',
      html: `
        <h2>Payment Confirmed</h2>
        <p>Your payment of $${data.amount} has been received.</p>
        <p>Job Date: ${data.date}</p>
      `,
      sms: `Payment of $${data.amount} received. Thank you!`,
    },
    job_accepted: {
      subject: 'Cleaner Assigned to Your Job',
      html: `
        <h2>Your Cleaner: ${data.cleanerName}</h2>
        <p>Rating: ${data.cleanerRating}★</p>
        <p>Arrival: ${data.date} at ${data.time}</p>
        <p>Total: $${data.total}</p>
      `,
      sms: `Cleaner ${data.cleanerName} assigned for ${data.date} at ${data.time}.`,
    },
  };

  const template = templates[type];
  if (!template) return;

  await Promise.all([
    sendMail(email, template.subject, template.html).catch(err =>
      console.error('Email send error:', err)
    ),
    sendSmsViaQuo(phone, template.sms),
  ]);
}
