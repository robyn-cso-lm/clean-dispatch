'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-green-50 to-white">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Professional cleaning,{' '}
          <span className="text-green-600">instantly booked</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Get an instant quote, pick your time, and a vetted cleaner handles the rest.
          No phone calls. No guessing. Just a clean home.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/client/quote"
            className="inline-block bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors"
          >
            Get your free quote →
          </Link>
          <Link
            href="/how-it-works"
            className="inline-block bg-white text-gray-700 border border-gray-300 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors"
          >
            How it works
          </Link>
        </div>
      </section>

      {/* Two-panel CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Clients */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 border-l-4 border-l-green-500">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get Your Home Cleaned</h2>
            <p className="text-gray-600 mb-6">
              Instant quote, book a time that works for you, and our trusted cleaners handle the rest.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Instant online quote',
                'Book in 2 minutes',
                'Professional & vetted cleaners',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="text-green-600 font-bold text-lg">✓</span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/client/quote"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Get Started →
            </Link>
          </div>

          {/* Cleaners */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 border-l-4 border-l-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Become a Cleaner</h2>
            <p className="text-gray-600 mb-6">
              Sign up, get approved, and start accepting jobs. We handle scheduling and payments.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                '$20/hour + $8/job gas fee',
                'Auto-assigned jobs from your area',
                'Weekly automatic payouts',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="text-green-600 font-bold text-lg">✓</span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/cleaner/signup"
              className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Join Now →
            </Link>
          </div>
        </div>

        {/* Service area */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Now Serving</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { area: 'Apollo Beach', sub: 'Hillsborough County' },
              { area: 'Hillsborough County', sub: 'Full coverage' },
              { area: 'Manatee County', sub: 'Coming soon' },
            ].map(({ area, sub }) => (
              <div key={area} className="flex items-center gap-3">
                <span className="text-green-600 text-lg">📍</span>
                <div>
                  <div className="font-semibold text-gray-900">{area}</div>
                  <div className="text-sm text-gray-500">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
