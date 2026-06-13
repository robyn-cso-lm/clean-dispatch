'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function Confirmation() {
  const status = useSearchParams().get('redirect_status');
  const succeeded = status === 'succeeded' || status === null;

  return (
    <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
      {succeeded ? (
        <>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-4">
            Your deposit is paid and we&apos;re assigning a cleaner now. You&apos;ll get an email and text
            confirming your cleaner shortly.
          </p>
          <p className="text-sm text-gray-500">The balance is collected after your clean is complete.</p>
          <Link href="/" className="inline-block mt-6 text-green-600 font-semibold hover:text-green-700">← Back to home</Link>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment didn&apos;t complete</h1>
          <p className="text-gray-600 mb-4">
            Your payment status is <strong>{status}</strong>. Your slot isn&apos;t booked yet — please try again.
          </p>
          <Link href="/client/quote" className="inline-block mt-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700">
            Try again
          </Link>
        </>
      )}
    </div>
  );
}

export default function BookingConfirmedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Suspense fallback={<p className="text-sm text-gray-400">Loading…</p>}>
        <Confirmation />
      </Suspense>
    </div>
  );
}
