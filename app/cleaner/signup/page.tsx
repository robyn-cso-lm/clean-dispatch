'use client';

import { useState } from 'react';

export default function CleanerSignupPage() {
  const [step, setStep] = useState<'personal' | 'references' | 'availability' | 'photos' | 'bank'>('personal');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    name: '',
    address: '',
    city: '',
    county: '',
    zipCode: '',
  });

  const [availability, setAvailability] = useState<Record<number, { start: string; end: string }>>({
    1: { start: '08:00', end: '17:00' },
    2: { start: '08:00', end: '17:00' },
    3: { start: '08:00', end: '17:00' },
    4: { start: '08:00', end: '17:00' },
    5: { start: '08:00', end: '17:00' },
  });

  const [bankAccount, setBankAccount] = useState('');

  const [references, setReferences] = useState([
    { name: '', phone: '', email: '', relationship: 'previous_client', comment: '' },
    { name: '', phone: '', email: '', relationship: 'previous_client', comment: '' },
  ]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Become a Cleaner</h1>
        <p className="text-gray-600 mb-8">Join our network and start earning $20/hour + $8/job</p>

        {/* Step Indicator */}
        <div className="flex gap-4 mb-8">
          {['personal', 'references', 'availability', 'photos', 'bank'].map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded ${
                step === s ? 'bg-green-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          {step === 'personal' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  County
                </label>
                <select
                  value={formData.county}
                  onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select county</option>
                  <option value="Hillsborough">Hillsborough</option>
                  <option value="Manatee">Manatee</option>
                </select>
              </div>

              <button
                onClick={() => setStep('references')}
                className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
              >
                Continue
              </button>
            </div>
          )}

          {step === 'references' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Professional References</h2>
              <p className="text-gray-600 text-sm">Provide 2 references from previous clients or employers</p>

              <div className="space-y-6">
                {references.map((ref, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-700 mb-4">Reference {i + 1}</div>

                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={ref.name}
                        onChange={(e) => {
                          const newRefs = [...references];
                          newRefs[i].name = e.target.value;
                          setReferences(newRefs);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                      />

                      <input
                        type="email"
                        placeholder="Email"
                        value={ref.email}
                        onChange={(e) => {
                          const newRefs = [...references];
                          newRefs[i].email = e.target.value;
                          setReferences(newRefs);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                      />

                      <input
                        type="tel"
                        placeholder="Phone"
                        value={ref.phone}
                        onChange={(e) => {
                          const newRefs = [...references];
                          newRefs[i].phone = e.target.value;
                          setReferences(newRefs);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                      />

                      <select
                        value={ref.relationship}
                        onChange={(e) => {
                          const newRefs = [...references];
                          newRefs[i].relationship = e.target.value;
                          setReferences(newRefs);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="previous_client">Previous Client</option>
                        <option value="employer">Employer</option>
                        <option value="colleague">Colleague</option>
                        <option value="other">Other</option>
                      </select>

                      <textarea
                        placeholder="Optional: How they can vouch for your work"
                        value={ref.comment}
                        onChange={(e) => {
                          const newRefs = [...references];
                          newRefs[i].comment = e.target.value;
                          setReferences(newRefs);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('personal')}
                  className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('availability')}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 'availability' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Weekly Availability</h2>
              <p className="text-gray-600 text-sm">Set your available hours. Jobs will be auto-assigned based on this schedule.</p>

              <div className="space-y-4">
                {days.map((day, i) => (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-24 font-medium text-gray-700">{day}</div>
                    <input
                      type="time"
                      value={availability[i + 1]?.start || '08:00'}
                      onChange={(e) =>
                        setAvailability({
                          ...availability,
                          [i + 1]: { ...availability[i + 1], start: e.target.value },
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={availability[i + 1]?.end || '17:00'}
                      onChange={(e) =>
                        setAvailability({
                          ...availability,
                          [i + 1]: { ...availability[i + 1], end: e.target.value },
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('references')}
                  className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('photos')}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 'photos' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Profile Photo</h2>
              <p className="text-gray-600 text-sm">Upload a professional headshot. This helps clients trust you.</p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-gray-600">
                  <div className="text-4xl mb-2">📸</div>
                  <p>Click to upload or drag and drop</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900">✓ Background check pending (24-48 hours)</p>
                <p className="text-sm text-blue-900">✓ Photo uploaded and verified</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('availability')}
                  className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('bank')}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 'bank' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Bank Account</h2>
              <p className="text-gray-600 text-sm">We'll deposit your earnings every week. Used for 1099 tax forms.</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Account (Last 4 digits)
                </label>
                <input
                  type="text"
                  placeholder="••••"
                  maxLength={4}
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-900 font-semibold">✓ You're ready to go!</p>
                <p className="text-sm text-green-900">Once approved, jobs will start coming in based on your availability.</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('photos')}
                  className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Back
                </button>
                <button className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700">
                  Complete Signup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
