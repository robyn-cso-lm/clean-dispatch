import nodemailer, { type Transporter } from 'nodemailer';

// SMTP transport (e.g. Gmail / Google Workspace). When SMTP_* are set we send
// through it; otherwise we fall back to Microsoft Graph.
let _smtp: Transporter | null = null;
function smtpTransporter(): Transporter | null {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  if (!_smtp) {
    const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
    _smtp = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return _smtp;
}

export async function getAccessToken(): Promise<string> {
  const tenantId = process.env.GRAPH_TENANT_ID;
  const clientId = process.env.GRAPH_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Missing Graph credentials (GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET).');
  }

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to get access token: ${err}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`No access token in response: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

export async function sendMail(
  to: string,
  subject: string,
  htmlBody: string,
  from = process.env.MAIL_FROM ?? 'hello@camica.ca'
): Promise<void> {
  // Prefer SMTP (Google Workspace) when configured.
  const smtp = smtpTransporter();
  if (smtp) {
    const name = process.env.MAIL_FROM_NAME ?? 'Camica Clean Dispatch';
    await smtp.sendMail({ from: `"${name}" <${from}>`, to, subject, html: htmlBody });
    return;
  }

  const token = await getAccessToken();

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${from}/sendMail`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: 'HTML', content: htmlBody },
          toRecipients: [{ emailAddress: { address: to } }],
        },
        saveToSentItems: true,
      }),
    }
  );

  if (!res.ok && res.status !== 202) {
    const err = await res.text();
    throw new Error(`Failed to send email: ${err}`);
  }
}
