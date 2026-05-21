'use client';

import { useState } from 'react';

export default function CleanerDashboard() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'earnings' | 'profile'>('jobs');

  const pendingJobs = [
    {
      id: '1',
      client: 'Sarah Johnson',
      address: '123 Main St, Apollo Beach',
      type: 'Deep Clean',
      date: '2026-05-25',
      time: '10:00',
      estimatedHours: 3.5,
      basePrice: 70,
      total: 78,
      status: 'pending',
    },
  ];

  const acceptedJobs = [
    {
      id: '2',
      client: 'Mike Davis',
      address: '456 Oak Ave, Tampa',
      type: 'Standard Clean',
      date: '2026-05-22',
      time: '14:00',
      estimatedHours: 2.5,
      basePrice: 50,
      total: 58,
      status: 'accepted',
    },
  ];

  const completedJobs = [
    {
      id: '3',
      client: 'Emma Wilson',
      address: '789 Pine Rd, Tampa',
      type: 'Standard Clean',
      date: '2026-05-20',
      estimatedHours: 2.5,
      actualHours: 2.75,
      earned: 63.5,
      rating: 5,
      status: 'completed',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here are your jobs and earnings.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-gray-600 text-sm font-semibold">Pending Jobs</div>
            <div className="text-3xl font-bold text-blue-600">{pendingJobs.length}</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-gray-600 text-sm font-semibold">Accepted</div>
            <div className="text-3xl font-bold text-green-600">{acceptedJobs.length}</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-gray-600 text-sm font-semibold">This Week Earned</div>
            <div className="text-3xl font-bold text-green-600">$121.50</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-gray-600 text-sm font-semibold">Rating</div>
            <div className="text-3xl font-bold text-yellow-500">5.0 ★</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-8">
          {['jobs', 'earnings', 'profile'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-4 font-semibold capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'jobs' && (
          <div className="space-y-6">
            {/* Pending Jobs */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🔔 New Jobs ({pendingJobs.length})
              </h2>
              <div className="space-y-4">
                {pendingJobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-blue-500">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.client}</h3>
                        <p className="text-gray-600 text-sm">{job.address}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">${job.total}</div>
                        <div className="text-sm text-gray-600">{job.estimatedHours}h</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                      <div>
                        <span className="text-gray-600">Type</span>
                        <div className="font-semibold text-gray-900">{job.type}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Date & Time</span>
                        <div className="font-semibold text-gray-900">{job.date} @ {job.time}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Breakdown</span>
                        <div className="text-sm">${job.basePrice} service + $8 gas</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700">
                        Accept Job
                      </button>
                      <button className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-300">
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Accepted Jobs */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                ✓ Accepted ({acceptedJobs.length})
              </h2>
              <div className="space-y-4">
                {acceptedJobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-green-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.client}</h3>
                        <p className="text-gray-600 text-sm">{job.address}</p>
                        <p className="text-sm mt-2">
                          {job.date} @ {job.time} ({job.estimatedHours}h)
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">${job.total}</div>
                        <div className="text-sm text-green-600 font-semibold">Confirmed</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Jobs */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                ✓ Completed ({completedJobs.length})
              </h2>
              <div className="space-y-4">
                {completedJobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.client}</h3>
                        <p className="text-gray-600 text-sm">{job.address}</p>
                        <p className="text-sm mt-2">
                          {job.date} ({job.actualHours}h actual)
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">${job.earned}</div>
                        <div className="text-yellow-500">{'★'.repeat(job.rating)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Earnings Breakdown</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <div className="text-gray-600 text-sm">This Week</div>
                <div className="text-3xl font-bold text-green-600">$121.50</div>
              </div>
              <div>
                <div className="text-gray-600 text-sm">This Month</div>
                <div className="text-3xl font-bold text-green-600">$485.00</div>
              </div>
              <div>
                <div className="text-gray-600 text-sm">All Time</div>
                <div className="text-3xl font-bold text-green-600">$2,340.00</div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Next Payout</h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="font-semibold text-green-900">$121.50</p>
                <p className="text-sm text-green-700">Scheduled for Friday, May 24</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate
                </label>
                <div className="text-2xl font-bold text-gray-900">$20/hour</div>
                <p className="text-sm text-gray-600">Fixed rate</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gas Fee
                </label>
                <div className="text-2xl font-bold text-gray-900">$8/job</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Availability
                </label>
                <div className="space-y-2">
                  <div>Monday - Friday: 8:00 AM - 5:00 PM</div>
                  <button className="text-blue-600 hover:text-blue-700 font-semibold">
                    Edit availability
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
