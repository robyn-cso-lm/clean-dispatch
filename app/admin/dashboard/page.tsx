'use client';

import { useState } from 'react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'cleaners' | 'clients'>('overview');

  const stats = [
    { label: 'Total Revenue', value: '$2,456.00', change: '+12%' },
    { label: 'Active Cleaners', value: '24', change: '+3' },
    { label: 'Jobs This Week', value: '47', change: '+18%' },
    { label: 'Client Satisfaction', value: '4.8★', change: 'Excellent' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-gray-600 text-sm font-semibold">{stat.label}</div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</div>
              <div className="text-xs text-green-600 mt-1">{stat.change}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-8">
          {['overview', 'jobs', 'cleaners', 'clients'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-4 font-semibold capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Recent Jobs */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Jobs</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 text-gray-600">Client</th>
                      <th className="text-left py-3 text-gray-600">Cleaner</th>
                      <th className="text-left py-3 text-gray-600">Date</th>
                      <th className="text-left py-3 text-gray-600">Amount</th>
                      <th className="text-left py-3 text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { client: 'Sarah Johnson', cleaner: 'Maria Garcia', date: '05/20', amount: '$78', status: 'Completed' },
                      { client: 'Mike Davis', cleaner: 'James Wilson', date: '05/19', amount: '$58', status: 'Completed' },
                      { client: 'Emma Wilson', cleaner: 'Maria Garcia', date: '05/18', amount: '$95', status: 'Completed' },
                    ].map((job, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-3 font-medium text-gray-900">{job.client}</td>
                        <td className="py-3 text-gray-600">{job.cleaner}</td>
                        <td className="py-3 text-gray-600">{job.date}</td>
                        <td className="py-3 font-semibold text-green-600">{job.amount}</td>
                        <td className="py-3">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                            {job.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Cleaners</h3>
                <div className="space-y-3">
                  {['Maria Garcia (4.9★)', 'James Wilson (4.8★)', 'Sofia Martinez (4.7★)'].map((cleaner, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-gray-700">{cleaner}</span>
                      <span className="text-gray-600 text-sm">15 jobs</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h3>
                <div className="space-y-3">
                  <div className="p-3 border border-yellow-200 bg-yellow-50 rounded">
                    <p className="text-sm font-medium text-gray-900">2 New Cleaner Applications</p>
                    <button className="text-blue-600 hover:text-blue-700 text-xs font-semibold mt-1">
                      Review now →
                    </button>
                  </div>
                  <div className="p-3 border border-blue-200 bg-blue-50 rounded">
                    <p className="text-sm font-medium text-gray-900">3 Background Checks Pending</p>
                    <button className="text-blue-600 hover:text-blue-700 text-xs font-semibold mt-1">
                      Check status →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Job Management</h2>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">Filter Options</h3>
                    <div className="flex gap-2 mt-3">
                      <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded text-sm font-semibold">
                        All
                      </button>
                      <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200">
                        Pending
                      </button>
                      <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200">
                        In Progress
                      </button>
                      <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200">
                        Completed
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cleaners' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Cleaner Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-gray-600">Name</th>
                    <th className="text-left py-3 text-gray-600">Status</th>
                    <th className="text-left py-3 text-gray-600">Jobs</th>
                    <th className="text-left py-3 text-gray-600">Rating</th>
                    <th className="text-left py-3 text-gray-600">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Maria Garcia', status: 'Active', jobs: 24, rating: '4.9★', earnings: '$1,240' },
                    { name: 'James Wilson', status: 'Active', jobs: 18, rating: '4.8★', earnings: '$890' },
                    { name: 'Sofia Martinez', status: 'Pending', jobs: 0, rating: '—', earnings: '$0' },
                  ].map((cleaner, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-3 font-medium text-gray-900">{cleaner.name}</td>
                      <td className="py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          cleaner.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {cleaner.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600">{cleaner.jobs}</td>
                      <td className="py-3 text-gray-600">{cleaner.rating}</td>
                      <td className="py-3 font-semibold text-gray-900">{cleaner.earnings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Client Management</h2>
            <p className="text-gray-600">View client accounts, bookings, and feedback.</p>
          </div>
        )}
      </div>
    </div>
  );
}
