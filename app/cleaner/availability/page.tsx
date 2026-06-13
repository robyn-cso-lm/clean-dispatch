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
  const [checkrStatus, setCheckrStatus] = useState('none');
  const [photos, setPhotos] = useState<{ id: string; driveItemId: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoMsg, setPhotoMsg] = useState('');

  const load = useCallback(async () => {
    if (!token) { setError('This link is missing its access token.'); setLoading(false); return; }
    try {
      const res = await fetch(`/api/cleaners/availability?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Could not load your profile.'); return; }
      setName(data.name);
      setCheckrStatus(data.checkrStatus ?? 'none');
      setPhotos(data.photos ?? []);
      const next = { ...DEFAULT };
      for (const a of data.availability as { dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }[]) {
        next[a.dayOfWeek] = { start: a.startTime, end: a.endTime, enabled: a.isAvailable };
      }
      setAvailability(next);
    } catch {
      setError('Network error loading your profile.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function uploadPhotos(files: File[]) {
    if (files.length === 0) return;
    setUploading(true);
    setPhotoMsg('');
    try {
      const fd = new FormData();
      fd.append('token', token ?? '');
      files.forEach((f) => fd.append('photos', f));
      const res = await fetch('/api/cleaners/photos', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setPhotoMsg(data.error ?? 'Upload failed.'); return; }
      setPhotoMsg(`Added ${data.uploaded} photo${data.uploaded === 1 ? '' : 's'} ✓`);
      await load();
    } catch {
      setPhotoMsg('Network error uploading photos.');
    } finally {
      setUploading(false);
    }
  }

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
    return <p className="text-sm text-gray-400 p-12 text-center">Loading your profile…</p>;
  }

  if (error && !name) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-900 font-semibold mb-1">Can&apos;t open your profile</p>
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  const checkrLabel: Record<string, { text: string; cls: string }> = {
    clear: { text: 'Background check: passed ✓', cls: 'bg-green-50 border-green-200 text-green-800' },
    consider: { text: 'Background check: under review', cls: 'bg-sun-100 border-sun-300 text-gray-800' },
    invitation_sent: { text: 'Background check: check your email to complete it', cls: 'bg-sun-100 border-sun-300 text-gray-800' },
    pending: { text: 'Background check: in progress', cls: 'bg-sun-100 border-sun-300 text-gray-800' },
    none: { text: 'Background check: not started — we\'ll email you a link from our screening partner', cls: 'bg-gray-50 border-gray-200 text-gray-600' },
    error: { text: 'Background check: not started yet', cls: 'bg-gray-50 border-gray-200 text-gray-600' },
    suspended: { text: 'Background check: needs attention — please contact us', cls: 'bg-coral-100 border-coral-200 text-coral-600' },
  };
  const ck = checkrLabel[checkrStatus] ?? checkrLabel.none;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-extrabold text-green-900">Your CleanDispatch Profile ✨</h1>
        <a href={`/cleaner/dashboard?token=${encodeURIComponent(token ?? '')}`} className="text-sm font-semibold text-green-700 hover:text-green-800 whitespace-nowrap">
          My jobs →
        </a>
      </div>
      <p className="text-gray-600 mb-8">
        {name ? `Hi ${name.split(' ')[0]} — ` : ''}a few quick things so we can keep sending you jobs.
      </p>

      {/* Background check */}
      <div className={`rounded-xl border p-4 mb-6 text-sm font-medium ${ck.cls}`}>{ck.text}</div>

      {/* Work photos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-green-900 mb-1">Photos of your work</h2>
        <p className="text-sm text-gray-600 mb-4">
          Add a few photos of homes you&apos;ve cleaned (before/after shots are great). Our cleaners are the face of the company.
        </p>

        {photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
            {photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={`/api/files/${p.driveItemId}`}
                alt="Your work sample"
                className="w-full h-20 object-cover rounded-lg border border-gray-200"
              />
            ))}
          </div>
        )}

        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors">
          <span className="text-sm font-medium text-gray-700">{uploading ? 'Uploading…' : 'Tap to add photos'}</span>
          <span className="text-xs text-gray-400 mt-0.5">JPG or PNG</span>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            className="hidden"
            onChange={(e) => { uploadPhotos(Array.from(e.target.files ?? [])); e.target.value = ''; }}
          />
        </label>
        {photoMsg && <p className="text-sm text-green-700 mt-3 font-medium">{photoMsg}</p>}
      </div>

      <h2 className="font-bold text-green-900 mb-2">Your weekly availability</h2>
      <p className="text-sm text-gray-600 mb-3">Jobs are only offered to you within these windows.</p>
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
