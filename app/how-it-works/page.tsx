'use client';

import Link from 'next/link';

export default function HowItWorks() {
  return (
    <div className="bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900">How Camica Clean Dispatch Works</h1>
          <p className="text-xl text-gray-600 mt-2">
            The fastest way to book a professional cleaner in Tampa Bay
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* For Clients */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">For Clients</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                num: '1',
                title: 'Enter Your Details',
                description: 'Tell us about your home: square footage, bedrooms, bathrooms, and cleaning type.',
                icon: '📝',
              },
              {
                num: '2',
                title: 'Get Instant Quote',
                description: 'See the exact price in seconds. No surprises, no hidden fees.',
                icon: '💰',
              },
              {
                num: '3',
                title: 'Pick Your Date & Time',
                description: 'Choose from available time slots up to 4 weeks in advance.',
                icon: '📅',
              },
              {
                num: '4',
                title: 'Professional Cleaning',
                description: 'Your vetted cleaner arrives on time. You get before/after photos.',
                icon: '✨',
              },
            ].map((step) => (
              <div key={step.num} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div className="text-5xl mb-4">{step.icon}</div>
                <div className="text-2xl font-bold text-green-600 mb-3">Step {step.num}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/client/quote"
              className="inline-block bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors"
            >
              Get Your Free Quote Now
            </Link>
          </div>
        </div>

        {/* Benefits for Clients */}
        <div className="mb-20 bg-green-50 rounded-xl p-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Why Clients Love Us</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { title: 'No Phone Calls', desc: 'Everything online. Book in 2 minutes.' },
              { title: 'Transparent Pricing', desc: 'See the price before you book. Zero surprise charges.' },
              { title: 'Vetted Cleaners', desc: 'Background-checked professionals with 2+ references.' },
              { title: 'Quality Guaranteed', desc: 'Before/after photos. 5-star rating system keeps cleaners accountable.' },
              { title: 'Flexible Scheduling', desc: 'Book up to 4 weeks in advance. Cancel anytime.' },
              { title: 'Auto-Protection', desc: 'If a job runs over, we protect you from surprise charges.' },
            ].map((benefit) => (
              <div key={benefit.title} className="flex gap-4">
                <span className="text-green-600 font-bold text-xl mt-0.5">✓</span>
                <div>
                  <h4 className="font-semibold text-gray-900">{benefit.title}</h4>
                  <p className="text-gray-700">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* For Cleaners */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">For Cleaners</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">How You Get Jobs</h3>
              <ol className="space-y-4">
                {[
                  {
                    step: '1.',
                    title: 'Set Your Availability',
                    desc: 'Tell us your work schedule (e.g., Mon–Fri 8am–5pm)',
                  },
                  {
                    step: '2.',
                    title: 'Auto-Assigned Jobs',
                    desc: 'We match you with nearby jobs that fit your schedule. You get email + SMS notification.',
                  },
                  {
                    step: '3.',
                    title: 'Accept or Decline (2–3 min window)',
                    desc: 'No pressure. Decline if you\'re busy, we assign someone else.',
                  },
                  {
                    step: '4.',
                    title: 'Show Up & Earn',
                    desc: '$20/hr + $8/job gas fee. Payment automatic every Friday.',
                  },
                ].map((item) => (
                  <li key={item.step} className="flex gap-4">
                    <span className="text-xl font-bold text-green-600 mt-0.5">{item.step}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-green-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Earnings</h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Hourly Rate</p>
                  <p className="text-3xl font-bold text-green-600">$20/hour</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Gas Fee (per job)</p>
                  <p className="text-3xl font-bold text-green-600">$8/job</p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-green-500">
                  <p className="text-sm text-gray-600">Example: 4 jobs/week</p>
                  <p className="text-3xl font-bold text-green-600">$1,152/month</p>
                  <p className="text-xs text-gray-500 mt-2">4 jobs × 3h × $20/hr + $32 gas = $288/week</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/cleaner/signup"
              className="inline-block bg-gray-900 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors"
            >
              Start Earning Now
            </Link>
          </div>
        </div>

        {/* Why Choose */}
        <div className="bg-green-50 rounded-xl p-12 mb-20">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Why Cleaners Choose Camica Clean Dispatch</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { title: 'No Admin Work', desc: 'We handle scheduling, payments, and customer communication.' },
              { title: 'No Haggling', desc: 'Fixed $20/hr + $8/job. No back-and-forth with clients.' },
              { title: 'Automatic Payouts', desc: 'Every Friday to your bank. No invoicing or chasing payments.' },
              { title: 'Build Your Reputation', desc: 'Earn 5-star reviews. Repeat clients = steady income.' },
              { title: 'We Have Your Back', desc: 'If a job runs over, we get client approval for extra charges.' },
              { title: 'Community of Professionals', desc: 'Join vetted cleaners across Tampa Bay.' },
            ].map((benefit) => (
              <div key={benefit.title} className="flex gap-4">
                <span className="text-green-600 font-bold text-xl mt-0.5">✓</span>
                <div>
                  <h4 className="font-semibold text-gray-900">{benefit.title}</h4>
                  <p className="text-gray-700">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Frequently Asked Questions</h2>

          <div className="space-y-4">
            {[
              {
                q: 'How soon can I get my home cleaned?',
                a: 'You can book up to 4 weeks in advance. Most homes get cleaned within 1–2 weeks.',
              },
              {
                q: 'What if my cleaner cancels?',
                a: "We assign a replacement immediately. You get notified with the new cleaner's details and photo.",
              },
              {
                q: 'What if I need additional services?',
                a: 'Add fridge clean, oven clean, blinds, or laundry service when booking. Pricing is transparent upfront.',
              },
              {
                q: 'How do cleaners get paid?',
                a: 'Every Friday via automatic direct deposit. No invoicing, no waiting.',
              },
              {
                q: 'Do you do residential and commercial?',
                a: 'Currently residential only. We focus on homes in Hillsborough County, Manatee County, and Apollo Beach.',
              },
              {
                q: 'What if the job takes longer than estimated?',
                a: "We notify you with the additional charge and request approval before releasing the cleaner's payment. You approve or deny.",
              },
            ].map((item) => (
              <div key={item.q} className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-2">{item.q}</h4>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-green-600 rounded-xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-xl mb-8 text-green-100">
            Book a cleaner or start earning — both take less than 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/client/quote"
              className="bg-white text-green-700 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
            >
              Book a Cleaner
            </Link>
            <Link
              href="/cleaner/signup"
              className="bg-green-700 text-white border border-green-500 px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors"
            >
              Become a Cleaner
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
