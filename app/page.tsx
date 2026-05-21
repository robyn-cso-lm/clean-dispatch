'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CleanDispatch</h1>
            <p className="text-gray-600">Professional cleaning, instantly booked</p>
          </div>
          <Link href="/how-it-works" className="text-blue-600 hover:text-blue-700 font-semibold">
            How It Works
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-blue-500">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Get Your Home Cleaned</h2>
            <p className="text-gray-600 mb-6">Get an instant quote, book a time that works for you, and our trusted cleaners handle the rest.</p>
            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <span className="text-green-500 font-bold mr-3">✓</span>
                <span>Instant online quote</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 font-bold mr-3">✓</span>
                <span>Book in 2 minutes</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 font-bold mr-3">✓</span>
                <span>Professional & vetted cleaners</span>
              </div>
            </div>
            <Link href="/client/quote" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
              Get Started →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-green-500">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Become a Cleaner</h2>
            <p className="text-gray-600 mb-6">Sign up, get approved, and start accepting jobs. We handle the scheduling and payments.</p>
            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <span className="text-green-500 font-bold mr-3">✓</span>
                <span>$20/hour + $8/job gas fee</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 font-bold mr-3">✓</span>
                <span>Auto-assigned jobs from your area</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 font-bold mr-3">✓</span>
                <span>Weekly automatic payouts</span>
              </div>
            </div>
            <Link href="/cleaner/signup" className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition">
              Join Now →
            </Link>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-lg shadow p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Now Serving</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold text-gray-900">Apollo Beach</h4>
              <p className="text-gray-600 text-sm">Hillsborough County</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Hillsborough County</h4>
              <p className="text-gray-600 text-sm">Full coverage</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Manatee County</h4>
              <p className="text-gray-600 text-sm">Coming soon</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
