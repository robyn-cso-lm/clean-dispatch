'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Job = {
  assignmentId: string;
  status: string;
  onHold: boolean;
  actualHours: number | null;
  payout: number;
  job: {
    serviceType: string;
    scheduledDate: string;
    scheduledTime: string;
    estimatedHours: number;
    quoteAmount: number;
    bedrooms: number;
    bathrooms: number;
    specialRequests: string | null;
    client: { name: string; address: string; city: string; phone: string };
  };
};

type Data = {
  name: string;
  approved: boolean;
  earned: number;
  rating: number;
  reviewCount: number;
  pending: Job[];
  accepted: Job[];
  completed: Job[];
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function JobCard({
  j,
  token,
  onChange,
  accent,
}: {
  j: Job;
  token: string;
  onChange: () => void;
  accent: string;
}) {
  const [busy, setBusy] = useState(false);

  async function act(action: 'accept' | 'decline' | 'complete') {
    let actualHours: number | undefined;
    if (action === 'complete') {
      const input = window.prompt(
        `How many hours did the job take? (estimated ${j.job.estimatedHours}h)`,
        String(j.job.estimatedHours)
      );
      if (input === null) return;
      actualHours = parseFloat(input);
      if (Number.isNaN(actualHours) || actualHours <= 0) {
        window.alert('Please enter a valid number of hours.');
        return;
      }
    }
    setBusy(true);
    try {
      const res = await fetch('/api/cleaners/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, assignmentId: j.assignmentId, action, actualHours }),
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error ?? 'Something went wrong.');
        return;
      }
      if (action === 'complete' && data.onHold) {
        window.alert(`Logged. Because it ran over estimate, the client must approve an extra $${data.additionalCharge?.toFixed?.(2) ?? ''} before it's finalized.`);
      }
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${accent}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{j.job.client.name}</h3>
          <p className="text-gray-600 text-sm">{j.job.client.address}{j.job.client.city ? `, ${j.job.client.city}` : ''}</p>
          <p className="text-gray-500 text-sm mt-1">{fmtDate(j.job.scheduledDate)} @ {j.job.scheduledTime}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-green-600">${j.payout.toFixed(2)}</div>
          <div className="text-xs text-gray-500">{(j.actualHours ?? j.job.estimatedHours)}h · you earn</div>
        </div>
      </div>

      <div className="text-sm text-gray-600 capitalize mb-1">
        {j.job.serviceType.replace('-', ' ')} · {j.job.bedrooms} bd / {j.job.bathrooms} ba
      </div>
      {j.job.specialRequests && (
        <p className="text-sm text-gray-500 mb-3">📝 {j.job.specialRequests}</p>
      )}

      {j.status === 'pending' && (
        <div className="flex gap-3 mt-4">
          <button onClick={() => act('accept')} disabled={busy}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
            {busy ? '…' : 'Accept job'}
          </button>
          <button onClick={() => act('decline')} disabled={busy}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50">
            Decline
          </button>
        </div>
      )}
      {j.status === 'accepted' && !j.onHold && (
        <div className="flex items-center gap-3 mt-4">
          <a href={`tel:${j.job.client.phone}`} className="text-sm font-semibold text-green-700">📞 Call client</a>
          <button onClick={() => act('complete')} disabled={busy}
            className="ml-auto bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
            {busy ? '…' : 'Mark complete'}
          </button>
        </div>
      )}
      {j.onHold && (
        <p className="text-sm text-coral-600 font-medium mt-3">Awaiting client approval for extra time.</p>
      )}
    </div>
  );
}

function Dashboard() {
  const token = useSearchParams().get('token') ?? '';
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) { setError('This link is missing its access token.'); setLoading(false); return; }
    try {
      const res = await fetch(`/api/cleaners/jobs?token=${encodeURIComponent(token)}`);
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? 'Could not load your jobs.'); return; }
      setData(d);
    } catch {
      setError('Network error loading your jobs.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="text-sm text-gray-400 p-12 text-center">Loading your jobs…</p>;
  if (error || !data) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-900 font-semibold mb-1">Can&apos;t open your dashboard</p>
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-extrabold text-green-900">Hi {data.name.split(' ')[0]} ✨</h1>
        <Link href={`/cleaner/availability?token=${encodeURIComponent(token)}`} className="text-sm font-semibold text-green-700 hover:text-green-800">
          Edit profile & availability →
        </Link>
      </div>

      {!data.approved && (
        <div className="bg-sun-100 border border-sun-300 rounded-xl p-4 mb-6 text-sm text-gray-800">
          Your account isn&apos;t approved yet — finish your profile (photos + background check) and we&apos;ll start sending jobs.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'New', value: data.pending.length },
          { label: 'Upcoming', value: data.accepted.length },
          { label: 'Earned', value: `$${data.earned.toFixed(2)}` },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm text-center">
            <div className="text-2xl font-extrabold text-green-600">{s.value}</div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {data.pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-green-900 mb-3">🔔 New jobs ({data.pending.length})</h2>
          <div className="space-y-4">
            {data.pending.map((j) => <JobCard key={j.assignmentId} j={j} token={token} onChange={load} accent="border-l-green-500" />)}
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-bold text-green-900 mb-3">Upcoming ({data.accepted.length})</h2>
        {data.accepted.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming jobs right now.</p>
        ) : (
          <div className="space-y-4">
            {data.accepted.map((j) => <JobCard key={j.assignmentId} j={j} token={token} onChange={load} accent="border-l-green-600" />)}
          </div>
        )}
      </section>

      {data.completed.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-green-900 mb-3">Completed ({data.completed.length})</h2>
          <div className="space-y-4">
            {data.completed.map((j) => <JobCard key={j.assignmentId} j={j} token={token} onChange={load} accent="border-l-gray-200" />)}
          </div>
        </section>
      )}
    </div>
  );
}

export default function CleanerDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<p className="text-sm text-gray-400 p-12 text-center">Loading…</p>}>
        <Dashboard />
      </Suspense>
    </div>
  );
}
