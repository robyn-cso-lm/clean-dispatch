// Checkr background-check integration (US).
// Docs: https://docs.checkr.com — uses HTTP Basic auth with the API key as the
// username and an empty password. All calls no-op gracefully (returning null)
// when CHECKR_API_KEY is unset, so the app still runs before Checkr is wired up.

const CHECKR_BASE = 'https://api.checkr.com/v1';

function authHeader(): string | null {
  const key = process.env.CHECKR_API_KEY;
  if (!key) return null;
  // Basic auth: base64("<api_key>:")
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`;
}

export function checkrConfigured(): boolean {
  return Boolean(process.env.CHECKR_API_KEY);
}

async function checkrPost(path: string, body: Record<string, unknown>) {
  const auth = authHeader();
  if (!auth) return null;

  const res = await fetch(`${CHECKR_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Checkr ${path} failed (${res.status}): ${err}`);
  }
  return res.json();
}

/**
 * Create a Checkr candidate, then send them a self-service invitation to
 * complete the background check. Returns the candidate id + status, or null
 * if Checkr isn't configured.
 */
export async function inviteCandidate(params: {
  name: string;
  email: string;
  phone?: string;
}): Promise<{ candidateId: string; status: string } | null> {
  if (!checkrConfigured()) return null;

  const [firstName, ...rest] = params.name.trim().split(/\s+/);
  const lastName = rest.join(' ') || firstName;

  const candidate = await checkrPost('/candidates', {
    email: params.email,
    first_name: firstName,
    last_name: lastName,
    ...(params.phone ? { phone: params.phone } : {}),
  });

  if (!candidate?.id) {
    throw new Error('Checkr candidate creation returned no id');
  }

  // A package + work location are required to send an invitation.
  const pkg = process.env.CHECKR_PACKAGE ?? 'tasker_standard';
  const state = process.env.CHECKR_WORK_STATE ?? 'FL';

  await checkrPost('/invitations', {
    candidate_id: candidate.id,
    package: pkg,
    work_locations: [{ country: 'US', state }],
  });

  return { candidateId: candidate.id as string, status: 'invitation_sent' };
}
