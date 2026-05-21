'use client';

import { useState } from 'react';
import { calculateQuote } from '@/lib/quoteCalculator';

export default function ClientQuotePage() {
  const [step, setStep] = useState<'details' | 'addons' | 'schedule' | 'payment'>('details');

  const [formData, setFormData] = useState({
    serviceType: 'standard' as const,
    squareFeet: 1500,
    bedrooms: 3,
    bathrooms: 2,
  });

  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');

  const standardAddOns = [
    { id: 'fridge', name: 'Fridge Deep Clean', price: 50 },
    { id: 'oven', name: 'Oven Clean', price: 40 },
    { id: 'blinds', name: 'Blinds Cleaning', price: 30 },
    { id: 'laundry', name: 'Laundry Service', price: 45 },
  ];

  const airbnbAddOns = [
    { id: 'linens', name: 'Full Linen Change (all beds)', price: 35 },
    { id: 'restock', name: 'Restock Supplies (soaps, TP, towels)', price: 20 },
    { id: 'fridge', name: 'Fridge Clean-Out', price: 50 },
    { id: 'oven', name: 'Oven Clean', price: 40 },
  ];

  const addOns = formData.serviceType === 'airbnb' ? airbnbAddOns : standardAddOns;

  const steps = ['details', 'addons', 'schedule', 'payment'] as const;
  const stepLabels = ['Details', 'Add-ons', 'Schedule', 'Pay'];

  const quote = calculateQuote({
    serviceType: formData.serviceType,
    squareFeet: formData.squareFeet,
    bedrooms: formData.bedrooms,
    bathrooms: formData.bathrooms,
    addOns: selectedAddOns,
  });

  const toggleAddOn = (id: string) => {
    setSelectedAddOns(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Get Your Quote</h1>
        <p className="text-gray-600 mb-8">Instant pricing. No phone calls required.</p>

        {/* Step indicator */}
        <div className="flex items-center mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  step === s
                    ? 'bg-green-600 text-white'
                    : steps.indexOf(step) > i
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {steps.indexOf(step) > i ? '✓' : i + 1}
              </div>
              <span
                className={`ml-2 text-sm font-medium hidden sm:block ${
                  step === s ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {stepLabels[i]}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={`mx-3 h-0.5 w-8 sm:w-16 transition-colors ${
                    steps.indexOf(step) > i ? 'bg-green-400' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              {step === 'details' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Property Details</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Type
                    </label>
                    <select
                      value={formData.serviceType}
                      onChange={(e) =>
                        setFormData({ ...formData, serviceType: e.target.value as any })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="standard">Standard Clean</option>
                      <option value="deep">Deep Clean</option>
                      <option value="airbnb">Airbnb / Short-Term Rental Turnover</option>
                      <option value="move-in">Move-In Clean</option>
                      <option value="move-out">Move-Out Clean</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Square Feet: <span className="text-green-700 font-semibold">{formData.squareFeet.toLocaleString()}</span>
                    </label>
                    <input
                      type="range"
                      min="500"
                      max="5000"
                      step="100"
                      value={formData.squareFeet}
                      onChange={(e) =>
                        setFormData({ ...formData, squareFeet: parseInt(e.target.value) })
                      }
                      className="w-full accent-green-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>500 sq ft</span>
                      <span>5,000 sq ft</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bedrooms
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.bedrooms}
                        onChange={(e) =>
                          setFormData({ ...formData, bedrooms: parseInt(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bathrooms
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.bathrooms}
                        onChange={(e) =>
                          setFormData({ ...formData, bathrooms: parseInt(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setStep('addons')}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Continue →
                  </button>
                </div>
              )}

              {step === 'addons' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Add-Ons</h2>
                  <p className="text-gray-600">Select any additional services (optional)</p>

                  <div className="space-y-3">
                    {addOns.map((addon) => (
                      <label
                        key={addon.id}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAddOns.includes(addon.id)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAddOns.includes(addon.id)}
                          onChange={() => toggleAddOn(addon.id)}
                          className="w-4 h-4 accent-green-600"
                        />
                        <span className="ml-3 flex-1 text-gray-900">{addon.name}</span>
                        <span className="text-gray-700 font-semibold">+${addon.price}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep('details')}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep('schedule')}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {step === 'schedule' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Schedule</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep('addons')}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep('payment')}
                      disabled={!scheduledDate}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Review & Pay →
                    </button>
                  </div>
                </div>
              )}

              {step === 'payment' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Ready to Book?</h2>
                  <p className="text-gray-600">Enter your email to confirm and pay.</p>

                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="Email address"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <input
                      type="password"
                      placeholder="Create a password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep('schedule')}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Back
                    </button>
                    <button className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                      Complete Booking & Pay
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quote Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Summary</h3>

            <div className="space-y-3 border-b border-gray-100 pb-4 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Service Type</span>
                <span className="font-semibold capitalize">{formData.serviceType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Est. Hours</span>
                <span className="font-semibold">{quote.hoursEstimate}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">Base Price</span>
                <span className="font-bold">${quote.basePrice}</span>
              </div>
            </div>

            {selectedAddOns.length > 0 && (
              <div className="space-y-2 border-b border-gray-100 pb-4 mb-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add-Ons</div>
                {selectedAddOns.map((id) => {
                  const addon = addOns.find((a) => a.id === id);
                  return (
                    <div key={id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{addon?.name}</span>
                      <span className="font-medium">+${addon?.price}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-center pt-2">
              <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Total</div>
              <div className="text-4xl font-bold text-green-600">${quote.totalQuote}</div>
              <p className="text-xs text-gray-500 mt-2">No hidden fees. Pay after booking.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
