'use client';

import { useState } from 'react';

export default function CleanerOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to CleanDispatch!',
      description: 'You\'re approved and ready to earn. Here\'s how to succeed.',
      icon: '🎉',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Your background check passed! You'll start receiving jobs immediately based on your availability.
          </p>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="font-semibold text-green-900">You're earning:</p>
            <p className="text-green-800">$20/hour + $8 per job (gas)</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Best Practice #1: The First Impression',
      description: 'Your first jobs are crucial for ratings.',
      icon: '⭐',
      content: (
        <div className="space-y-4">
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-lg">✓</span>
              <div>
                <p className="font-semibold text-gray-900">Arrive 5-10 min early</p>
                <p className="text-sm text-gray-600">Shows professionalism. Clients notice.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-lg">✓</span>
              <div>
                <p className="font-semibold text-gray-900">Wear clean, professional clothes</p>
                <p className="text-sm text-gray-600">Builds trust instantly.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-lg">✓</span>
              <div>
                <p className="font-semibold text-gray-900">Be friendly & communicative</p>
                <p className="text-sm text-gray-600">Ask about problem areas. Show you care.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-lg">✓</span>
              <div>
                <p className="font-semibold text-gray-900">Take before/after photos</p>
                <p className="text-sm text-gray-600">Upload immediately after job.</p>
              </div>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Best Practice #2: Time Management',
      description: 'Finish on time = happy clients = repeat bookings.',
      icon: '⏰',
      content: (
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="font-semibold text-gray-900 mb-2">The Golden Rule:</p>
            <p className="text-gray-700">
              Finish within estimated time. If you're running over, text the client ASAP.
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-semibold text-gray-900">Time-saving tips:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Set phone timer when you arrive</li>
              <li>• Clean one room at a time (don't jump around)</li>
              <li>• Have all supplies ready before starting</li>
              <li>• Notify us if job requires more time (we can get approval)</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: 'Best Practice #3: Communication',
      description: 'Great communication = 5-star ratings.',
      icon: '💬',
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-2">✓ When job assigned:</p>
              <p className="text-sm text-gray-600">Accept within 2 min. Text client your arrival time.</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-2">✓ During the job:</p>
              <p className="text-sm text-gray-600">If running late or need clarification, text immediately.</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-2">✓ After the job:</p>
              <p className="text-sm text-gray-600">Upload before/after photos. Say "thank you!"</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Best Practice #4: Quality Standards',
      description: 'Quality = Repeat clients = Consistent income.',
      icon: '✨',
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-gray-900 mb-2">Standard Clean Checklist:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Vacuum all carpets</li>
                <li>✓ Mop all hard floors</li>
                <li>✓ Clean all surfaces (dust, wipe down)</li>
                <li>✓ Clean mirrors & windows</li>
                <li>✓ Empty trash cans</li>
                <li>✓ Quick bathroom clean</li>
              </ul>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-sm text-yellow-900">
              💡 <strong>Pro tip:</strong> Ask client about their "must-haves" on arrival. Customization = higher ratings.
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Your First Week Strategy',
      description: 'How to build momentum & get repeat clients.',
      icon: '🚀',
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
              <p className="font-semibold text-blue-900 mb-2">Days 1-3: Perfect First Impressions</p>
              <p className="text-sm text-blue-800">Accept every job. Deliver 5-star quality. Get 5-star reviews.</p>
            </div>
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <p className="font-semibold text-green-900 mb-2">Days 4-7: Build Your Reputation</p>
              <p className="text-sm text-green-800">You'll start getting repeat clients from your first week. That's where the money is.</p>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Reality check:</strong> First month = building reputation. Second month = getting repeat clients & premium jobs. Keep quality high.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Earnings Potential',
      description: 'What you can realistically earn.',
      icon: '💰',
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700">Conservative (4 jobs/week):</p>
              <p className="text-2xl font-bold text-green-600">$1,152/month</p>
              <p className="text-xs text-gray-600">4 jobs × $20/hr (avg 3h) + $8 gas = $288/week</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700">Moderate (6 jobs/week):</p>
              <p className="text-2xl font-bold text-green-600">$1,728/month</p>
              <p className="text-xs text-gray-600">6 jobs × $20/hr (avg 3h) + $8 gas = $432/week</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700">Aggressive (8+ jobs/week):</p>
              <p className="text-2xl font-bold text-green-600">$2,304+/month</p>
              <p className="text-xs text-gray-600">8+ jobs × $20/hr (avg 3h) + $8 gas = $576+/week</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'You\'re All Set!',
      description: 'Ready to start earning.',
      icon: '🎯',
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 p-6 rounded-lg text-center">
            <p className="text-lg font-semibold text-green-900 mb-2">Your Dashboard is Live</p>
            <p className="text-green-800 mb-6">Jobs will start appearing based on your availability. You'll receive notifications 24 hours before each assignment.</p>
            <a
              href="/cleaner/dashboard"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
            >
              Go to Dashboard →
            </a>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm text-gray-700 mb-3">Questions? Contact support:</p>
            <p className="text-sm"><strong>Email:</strong> support@cleandispatch.com</p>
            <p className="text-sm"><strong>Phone:</strong> (813) 555-0123</p>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded ${
                  i <= currentStep ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-4xl mb-4">{currentStepData.icon}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {currentStepData.title}
          </h1>
          <p className="text-gray-600 mb-8">{currentStepData.description}</p>

          <div className="mb-8">{currentStepData.content}</div>

          {/* Navigation */}
          <div className="flex gap-4">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                ← Back
              </button>
            )}
            <button
              onClick={() => {
                if (currentStep < steps.length - 1) {
                  setCurrentStep(currentStep + 1);
                }
              }}
              className={`flex-1 py-3 rounded-lg font-semibold ${
                currentStep === steps.length - 1
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {currentStep === steps.length - 1 ? 'Start Earning' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
