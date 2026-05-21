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

  const addOns = [
    { id: 'fridge', name: 'Fridge Deep Clean', price: 50 },
    { id: 'oven', name: 'Oven Clean', price: 40 },
    { id: 'blinds', name: 'Blinds Cleaning', price: 30 },
    { id: 'laundry', name: 'Laundry Service', price: 45 },
  ];

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Get Your Quote</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-8">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="standard">Standard Clean</option>
                      <option value="deep">Deep Clean</option>
                      <option value="move-in">Move-In Clean</option>
                      <option value="move-out">Move-Out Clean</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Square Feet: {formData.squareFeet}
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
                      className="w-full"
                    />
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setStep('addons')}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Continue
                  </button>
                </div>
              )}

              {step === 'addons' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Add-Ons</h2>
                  <p className="text-gray-600">Select any additional services</p>

                  <div className="space-y-3">
                    {addOns.map((addon) => (
                      <label key={addon.id} className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedAddOns.includes(addon.id)}
                          onChange={() => toggleAddOn(addon.id)}
                          className="w-4 h-4"
                        />
                        <span className="ml-3 flex-1">{addon.name}</span>
                        <span className="text-gray-600 font-semibold">${addon.price}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep('details')}
                      className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-300"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep('schedule')}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {step === 'schedule' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Schedule</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep('addons')}
                      className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-300"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep('payment')}
                      disabled={!scheduledDate}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                      Review & Pay
                    </button>
                  </div>
                </div>
              )}

              {step === 'payment' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Ready to Book?</h2>
                  <p className="text-gray-600">Sign in or create an account to complete booking</p>

                  <div className="space-y-3">
                    <input type="email" placeholder="Email" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    <input type="password" placeholder="Password" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>

                  <button className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700">
                    Complete Booking & Pay
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quote Summary */}
          <div className="bg-white rounded-lg shadow p-8 h-fit sticky top-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Summary</h3>

            <div className="space-y-3 border-b pb-4 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Service Type</span>
                <span className="font-semibold capitalize">{formData.serviceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Est. Hours</span>
                <span className="font-semibold">{quote.hoursEstimate}h</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-900 font-semibold">Base Price</span>
                <span className="text-blue-600 font-bold">${quote.basePrice}</span>
              </div>
            </div>

            {selectedAddOns.length > 0 && (
              <div className="space-y-2 border-b pb-4 mb-4">
                <div className="text-sm font-semibold text-gray-700">Add-Ons</div>
                {selectedAddOns.map((id) => {
                  const addon = addOns.find((a) => a.id === id);
                  return (
                    <div key={id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{addon?.name}</span>
                      <span>${addon?.price}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Total Quote</div>
              <div className="text-4xl font-bold text-green-600">${quote.totalQuote}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
