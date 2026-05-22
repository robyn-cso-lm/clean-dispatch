'use client';

import { useState } from 'react';

export default function CleanerSignupPage() {
  const [step, setStep] = useState<'personal' | 'availability' | 'done'>('personal');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [availability, setAvailability] = useState<Record<number, { start: string; end: string; enabled: boolean }>>({
    1: { start: '08:00', end: '17:00', enabled: true },
    2: { start: '08:00', end: '17:00', enabled: true },
    3: { start: '08:00', end: '17:00', enabled: true },
    4: { start: '08:00', end: '17:00', enabled: true },
    5: { start: '08:00', end: '17:00', enabled: true },
    6: { start: '09:00', end: '14:00', enabled: false },
    0: { start: '09:00', end: '14:00', enabled: false },
  });

  const days = [
    { key: 1, label: 'Monday' },
    { key: 2, label: 'Tuesday' },
    { key: 3, label: 'Wednesday' },
    { key: 4, label: 'Thursday' },
    { key: 5, label: 'Friday' },
    { key: 6, label: 'Saturday' },
    { key: 0, label: 'Sunday' },
  ];

  function validate() {
    if (!formData.name.trim()) return 'Please enter your name.';
    if (!formData.email.trim() || !formData.email.includes('@')) return 'Please enter a valid email.';
    if (!formData.phone.trim()) return 'Please enter your phone number.';
    return '';
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setSubmitting(true);

    const enabledDays = Object.fromEntries(
      Object.entries(availability)
        .filter(([, v]) => v.enabled)
        .map(([k, v]) => [k, { start: v.start, end: v.end }])
    );

    try {
      const res = await fetch('/api/cleaners/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          availability: enabledDays,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setStep('done');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Received!</h2>
          <p className="text-gray-600 mb-4">
            Thanks, <strong>{formData.name.split(' ')[0]}</strong>! We&apos;ll review your application and be in touch within 24–48 hours.
          </p>
          <p className="text-sm text-gray-500">
            Check your email at <strong>{formData.email}</strong> for next steps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Become a Cleaner</h1>
        <p className="text-gray-600 mb-8">Earn $20/hr + $8/job gas fee. Flexible hours. Weekly pay.</p>

        {/* Step progress */}
        <div className="flex items-center gap-3 mb-8">
          {(['personal', 'availability'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s ? 'bg-green-600 text-white' : step === 'done' || (i === 0 && step === 'availability') ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {i === 0 && step === 'availability' ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium ${step === s ? 'text-gray-900' : 'text-gray-400'}`}>
                {s === 'personal' ? 'Your Info' : 'Availability'}
              </span>
              {i < 1 && <div className={`w-8 h-0.5 ${step === 'availability' ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {step === 'personal' && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-gray-900">Your Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  placeholder="(813) 555-1234"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
              )}

              <button
                onClick={() => {
                  const err = validate();
                  if (err) { setError(err); return; }
                  setError('');
                  setStep('availability');
                }}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Continue →
              </button>

              <div className="pt-4 border-t border-gray-100 space-y-2">
                {['$20/hr + $8/job gas fee', 'Weekly direct deposit', 'Jobs assigned around your schedule', 'Apollo Beach & Hillsborough County'].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-600 font-bold">✓</span> {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'availability' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Your Availability</h2>
                <p className="text-sm text-gray-600 mt-1">Check the days you&apos;re available. We&apos;ll match jobs to your schedule.</p>
              </div>

              <div className="space-y-3">
                {days.map(({ key, label }) => (
                  <div
                    key={key}
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                      availability[key].enabled ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <label className="flex items-center gap-2 w-28 cursor-pointer">
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

                    {availability[key].enabled && (
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
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('personal')}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting…' : 'Submit Application'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
