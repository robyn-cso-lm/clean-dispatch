'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

type DayState = { start: string; end: string; enabled: boolean };

const DAYS = [
  { key: 1, label: 'Monday' },
  { key: 2, label: 'Tuesday' },
  { key: 3, label: 'Wednesday' },
  { key: 4, label: 'Thursday' },
  { key: 5, label: 'Friday' },
  { key: 6, label: 'Saturday' },
  { key: 0, label: 'Sunday' },
];

const DEFAULT: Record<number, DayState> = {
  1: { start: '08:00', end: '17:00', enabled: false },
  2: { start: '08:00', end: '17:00', enabled: false },
  3: { start: '08:00', end: '17:00', enabled: false },
  4: { start: '08:00', end: '17:00', enabled: false },
  5: { start: '08:00', end: '17:00', enabled: false },
  6: { start: '09:00', end: '14:00', enabled: false },
  0: { start: '09:00', end: '14:00', enabled: false },
};

function AvailabilityEditor() {
  const token = useSearchParams().get('token');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [availability, setAvailability] = useState<Record<number, DayState>>(DEFAULT);

  const load = useCallback(async () => {
    if (!token) { setError('This link is missing its access token.'); setLoading(false); return; }
    try {
      const res = await fetch(`/api/cleaners/availability?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Could not load your schedule.'); return; }
      setName(data.name);
      const next = { ...DEFAULT };
      for (const a of data.availability as { dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }[]) {
        next[a.dayOfWeek] = { start: a.startTime, end: a.endTime, enabled: a.isAvailable };
      }
      setAvailability(next);
    } catch {
      setError('Network error loading your schedule.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    setError('');
    setSavedAt(null);
    try {
      const res = await fetch('/api/cleaners/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, availability }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Could not save.'); return; }
      setSavedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    } catch {
      setError('Network error saving your schedule.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-400 p-12 text-center">Loading your schedule…</p>;
  }

  if (error && !name) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-900 font-semibold mb-1">Can&apos;t open your schedule</p>
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Your Availability</h1>
      <p className="text-gray-600 mb-8">
        {name ? `Hi ${name.split(' ')[0]} — ` : ''}set the days and hours you can work. Jobs are only
        offered to you within these windows.
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
        {DAYS.map(({ key, label }) => (
          <div
            key={key}
            className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
              availability[key].enabled ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'
            }`}
          >
            <label className="flex items-center gap-2 w-32 cursor-pointer">
              <input
                type="checkbox"
                checked={availability[key].enabled}
                onChange={(e) =>
                  setAvailability({ ...availability, [key]: { ...availability[key], enabled: e.target.checked } })
                }
                className="w-4 h-4 accent-green-600"
              />
              <span className={`text-sm font-medium ${availability[key].enabled ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
            </label>

            {availability[key].enabled ? (
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="time"
                  value={availability[key].start}
                  onChange={(e) => setAvailability({ ...availability, [key]: { ...availability[key], start: e.target.value } })}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-gray-400">–</span>
                <input
                  type="time"
                  value={availability[key].end}
                  onChange={(e) => setAvailability({ ...availability, [key]: { ...availability[key], end: e.target.value } })}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            ) : (
              <span className="text-sm text-gray-400">Unavailable</span>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg mt-4">{error}</p>}

      <div className="flex items-center gap-4 mt-6">
        <button
          onClick={save}
          disabled={saving}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Schedule'}
        </button>
        {savedAt && <span className="text-sm text-green-700 font-medium">Saved at {savedAt} ✓</span>}
      </div>
    </div>
  );
}

export default function CleanerAvailabilityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<p className="text-sm text-gray-400 p-12 text-center">Loading…</p>}>
        <AvailabilityEditor />
      </Suspense>
    </div>
  );
}
