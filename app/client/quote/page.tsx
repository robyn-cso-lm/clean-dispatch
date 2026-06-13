'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { calculateQuote, type QuoteRequest } from '@/lib/quoteCalculator';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');
const DEPOSIT_PERCENT = 0.5; // display only; server is source of truth

type Contact = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
};

function DepositForm({ depositAmount }: { depositAmount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function pay() {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError('');
    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/client/booking-confirmed` },
    });
    // If we get here, confirmation failed (otherwise the browser redirects).
    if (submitError) setError(submitError.message ?? 'Payment failed. Please try again.');
    setSubmitting(false);
  }

  return (
    <div className="space-y-5">
      <PaymentElement />
      {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
      <button
        onClick={pay}
        disabled={!stripe || submitting}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Processing…' : `Pay $${depositAmount.toFixed(2)} Deposit & Book`}
      </button>
    </div>
  );
}

export default function ClientQuotePage() {
  const [step, setStep] = useState<'details' | 'addons' | 'schedule' | 'contact' | 'payment'>('details');

  const [formData, setFormData] = useState<{
    serviceType: QuoteRequest['serviceType'];
    squareFeet: number;
    bedrooms: number;
    bathrooms: number;
  }>({
    serviceType: 'standard',
    squareFeet: 1500,
    bedrooms: 3,
    bathrooms: 2,
  });

  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [slots, setSlots] = useState<string[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [contact, setContact] = useState<Contact>({
    name: '', email: '', phone: '', address: '', city: '', zipCode: '',
  });

  const [frequency, setFrequency] = useState<'one-time' | 'weekly' | 'biweekly' | 'monthly'>('one-time');
  const [tipPreset, setTipPreset] = useState<'none' | '15' | '20' | 'custom'>('none');
  const [customTip, setCustomTip] = useState('');

  const [clientSecret, setClientSecret] = useState('');
  const [depositAmount, setDepositAmount] = useState(0);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

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

  const steps = ['details', 'addons', 'schedule', 'contact', 'payment'] as const;
  const stepLabels = ['Details', 'Add-ons', 'Schedule', 'Contact', 'Pay'];

  const quote = calculateQuote({
    serviceType: formData.serviceType,
    squareFeet: formData.squareFeet,
    bedrooms: formData.bedrooms,
    bathrooms: formData.bathrooms,
    addOns: selectedAddOns,
  });

  const tipAmount =
    tipPreset === '15' ? Math.round(quote.totalQuote * 0.15 * 100) / 100
    : tipPreset === '20' ? Math.round(quote.totalQuote * 0.2 * 100) / 100
    : tipPreset === 'custom' ? Math.max(0, parseFloat(customTip) || 0)
    : 0;

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  // Load bookable slots whenever the date (or job size) changes.
  const fetchSlots = useCallback(async () => {
    if (!scheduledDate) { setSlots(null); return; }
    setLoadingSlots(true);
    setScheduledTime('');
    try {
      const res = await fetch(`/api/availability/slots?date=${scheduledDate}&hours=${quote.hoursEstimate}`);
      const data = await res.json();
      setSlots(res.ok ? data.slots : []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [scheduledDate, quote.hoursEstimate]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  async function startPayment() {
    if (!contact.name || !contact.email || !contact.phone || !contact.address) {
      setError('Please fill in your name, email, phone and address.');
      return;
    }
    setError('');
    setBooking(true);
    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact,
          serviceType: formData.serviceType,
          squareFeet: formData.squareFeet,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          addOns: selectedAddOns,
          scheduledDate,
          scheduledTime,
          frequency,
          tipAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Slot taken in the meantime — bounce back to scheduling.
        if (res.status === 409) {
          setSlots(data.slots ?? []);
          setScheduledTime('');
          setStep('schedule');
        }
        setError(data.error ?? 'Could not start checkout.');
        return;
      }
      setClientSecret(data.clientSecret);
      setDepositAmount(data.depositAmount);
      setStep('payment');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBooking(false);
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const depositPreview = Math.round(quote.totalQuote * DEPOSIT_PERCENT * 100) / 100;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Get Your Quote</h1>
        <p className="text-gray-600 mb-8">Instant pricing. Book a real, available cleaner.</p>

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
              <span className={`ml-2 text-sm font-medium hidden sm:block ${step === s ? 'text-gray-900' : 'text-gray-500'}`}>
                {stepLabels[i]}
              </span>
              {i < steps.length - 1 && (
                <div className={`mx-3 h-0.5 w-6 sm:w-12 transition-colors ${steps.indexOf(step) > i ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              {step === 'details' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Property Details</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                    <select
                      value={formData.serviceType}
                      onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as QuoteRequest['serviceType'] })}
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
                      type="range" min="500" max="5000" step="100"
                      value={formData.squareFeet}
                      onChange={(e) => setFormData({ ...formData, squareFeet: parseInt(e.target.value) })}
                      className="w-full accent-green-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>500 sq ft</span><span>5,000 sq ft</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                      <input type="number" min="0" value={formData.bedrooms}
                        onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                      <input type="number" min="0" value={formData.bathrooms}
                        onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">How often?</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {([
                        { v: 'one-time', l: 'One-time' },
                        { v: 'weekly', l: 'Weekly' },
                        { v: 'biweekly', l: 'Every 2 wks' },
                        { v: 'monthly', l: 'Monthly' },
                      ] as const).map((o) => (
                        <button
                          key={o.v}
                          onClick={() => setFrequency(o.v)}
                          className={`py-2 rounded-lg text-sm font-semibold border transition-colors ${
                            frequency === o.v ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-700 hover:border-green-400'
                          }`}
                        >
                          {o.l}
                        </button>
                      ))}
                    </div>
                    {frequency !== 'one-time' && (
                      <p className="text-xs text-gray-500 mt-2">
                        We&apos;ll keep the same cleaner where possible and rebook automatically. Skip or cancel anytime.
                      </p>
                    )}
                  </div>

                  <button onClick={() => setStep('addons')} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
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
                      <label key={addon.id}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAddOns.includes(addon.id) ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                        <input type="checkbox" checked={selectedAddOns.includes(addon.id)} onChange={() => toggleAddOn(addon.id)} className="w-4 h-4 accent-green-600" />
                        <span className="ml-3 flex-1 text-gray-900">{addon.name}</span>
                        <span className="text-gray-700 font-semibold">+${addon.price}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setStep('details')} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Back</button>
                    <button onClick={() => setStep('schedule')} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">Continue →</button>
                  </div>
                </div>
              )}

              {step === 'schedule' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Pick a Time</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input type="date" min={todayStr} value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  </div>

                  {scheduledDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Available Start Times</label>
                      {loadingSlots ? (
                        <p className="text-sm text-gray-400">Checking cleaner availability…</p>
                      ) : slots && slots.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {slots.map((t) => (
                            <button key={t} onClick={() => setScheduledTime(t)}
                              className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                                scheduledTime === t ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-700 hover:border-green-400'
                              }`}>
                              {t}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg">
                          No cleaners available on this date. Please try another day.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button onClick={() => setStep('addons')} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Back</button>
                    <button onClick={() => setStep('contact')} disabled={!scheduledTime}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {step === 'contact' && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold text-gray-900">Your Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="text" placeholder="Full name" value={contact.name}
                      onChange={(e) => setContact({ ...contact, name: e.target.value })}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                    <input type="tel" placeholder="Phone" value={contact.phone}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  </div>
                  <input type="email" placeholder="Email address" value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  <input type="text" placeholder="Street address" value={contact.address}
                    onChange={(e) => setContact({ ...contact, address: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="City" value={contact.city}
                      onChange={(e) => setContact({ ...contact, city: e.target.value })}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                    <input type="text" placeholder="ZIP code" value={contact.zipCode}
                      onChange={(e) => setContact({ ...contact, zipCode: e.target.value })}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  </div>

                  {/* Optional tip — 100% to the cleaner */}
                  <div className="border-t border-gray-100 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Add a tip for your cleaner? <span className="text-gray-400 font-normal">(optional — 100% goes to them)</span>
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {([
                        { v: 'none', l: 'No tip' },
                        { v: '15', l: `15% ($${(quote.totalQuote * 0.15).toFixed(0)})` },
                        { v: '20', l: `20% ($${(quote.totalQuote * 0.2).toFixed(0)})` },
                        { v: 'custom', l: 'Custom' },
                      ] as const).map((o) => (
                        <button
                          key={o.v}
                          type="button"
                          onClick={() => setTipPreset(o.v)}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                            tipPreset === o.v ? 'bg-coral-500 text-white border-coral-500' : 'border-gray-200 text-gray-700 hover:border-coral-400'
                          }`}
                        >
                          {o.l}
                        </button>
                      ))}
                    </div>
                    {tipPreset === 'custom' && (
                      <div className="mt-2 relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input
                          type="number" min="0" step="1" placeholder="0"
                          value={customTip}
                          onChange={(e) => setCustomTip(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-coral-400 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>

                  {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
                  <div className="flex gap-4">
                    <button onClick={() => setStep('schedule')} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Back</button>
                    <button onClick={startPayment} disabled={booking}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {booking ? 'Starting checkout…' : 'Continue to Payment →'}
                    </button>
                  </div>
                </div>
              )}

              {step === 'payment' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Pay Your Deposit</h2>
                  <p className="text-gray-600 text-sm">
                    A ${depositAmount.toFixed(2)} deposit holds your {new Date(scheduledDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {scheduledTime} booking. The balance is due after the clean.
                  </p>
                  {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <DepositForm depositAmount={depositAmount} />
                    </Elements>
                  ) : (
                    <p className="text-sm text-gray-400">Loading payment…</p>
                  )}
                  <button onClick={() => setStep('contact')} className="text-sm text-gray-500 hover:text-gray-900 font-medium">← Back to details</button>
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
                <span className="font-semibold capitalize">{formData.serviceType.replace('-', ' ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Est. Hours</span>
                <span className="font-semibold">{quote.hoursEstimate}h</span>
              </div>
              {scheduledDate && scheduledTime && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">When</span>
                  <span className="font-semibold">
                    {new Date(scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {scheduledTime}
                  </span>
                </div>
              )}
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
            {(() => {
              const dep = step === 'payment' ? depositAmount : depositPreview;
              const freqLabel: Record<string, string> = { weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly' };
              return (
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total{frequency !== 'one-time' ? ' / visit' : ''}</span>
                    <span className="font-semibold text-gray-900">${quote.totalQuote}</span>
                  </div>
                  {tipAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tip (to cleaner)</span>
                      <span className="font-medium text-coral-600">+${tipAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Due now (deposit{tipAmount > 0 ? ' + tip' : ''})</span>
                    <span className="font-bold text-green-600">${(dep + tipAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Balance after clean</span>
                    <span>${(quote.totalQuote - dep).toFixed(2)}</span>
                  </div>
                  {frequency !== 'one-time' && (
                    <div className="mt-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 font-medium">
                      🔁 {freqLabel[frequency]} plan — rebooks automatically, cancel anytime.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
