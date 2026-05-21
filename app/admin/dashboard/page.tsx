'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'cleaners' | 'clients'>('overview');
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  const stats = [
    { label: 'Total Revenue', value: '$2,456.00', change: '+12%' },
    { label: 'Active Cleaners', value: '24', change: '+3' },
    { label: 'Jobs This Week', value: '47', change: '+18%' },
    { label: 'Client Satisfaction', value: '4.8★', change: 'Excellent' },
  ];

  async function handleSignOut() {
    setSigningOut(true);
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 1L15.8 11.2L26 14L15.8 16.8L14 27L12.2 16.8L2 14L12.2 11.2Z" fill="#16A34A" />
              <circle cx="14" cy="14" r="2.5" fill="#15803D" />
            </svg>
            <span className="font-bold text-gray-900">CleanDispatch</span>
            <span className="text-gray-400 text-sm ml-1">/ Admin</span>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors disabled:opacity-50"
          >
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wide">{stat.label}</div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</div>
              <div className="text-xs text-green-600 mt-1 font-medium">{stat.change}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-8">
          {(['overview', 'jobs', 'cleaners', 'clients'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 pb-3 pt-1 font-semibold capitalize text-sm transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Recent Jobs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Jobs</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 text-gray-500 font-medium">Client</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Cleaner</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Date</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Amount</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { client: 'Sarah Johnson', cleaner: 'Maria Garcia', date: '05/20', amount: '$78', status: 'Completed' },
                      { client: 'Mike Davis', cleaner: 'James Wilson', date: '05/19', amount: '$58', status: 'Completed' },
                      { client: 'Emma Wilson', cleaner: 'Maria Garcia', date: '05/18', amount: '$95', status: 'Completed' },
                    ].map((job, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-3 font-medium text-gray-900">{job.client}</td>
                        <td className="py-3 text-gray-600">{job.cleaner}</td>
                        <td className="py-3 text-gray-600">{job.date}</td>
                        <td className="py-3 font-semibold text-green-600">{job.amount}</td>
                        <td className="py-3">
                          <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs font-semibold">
                            {job.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Top Cleaners</h3>
                <div className="space-y-3">
                  {['Maria Garcia (4.9★)', 'James Wilson (4.8★)', 'Sofia Martinez (4.7★)'].map((cleaner) => (
                    <div key={cleaner} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{cleaner}</span>
                      <span className="text-gray-500">15 jobs</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Pending Approvals</h3>
                <div className="space-y-3">
                  <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">2 New Cleaner Applications</p>
                    <button className="text-green-600 hover:text-green-700 text-xs font-semibold mt-1">
                      Review now →
                    </button>
                  </div>
                  <div className="p-3 border border-gray-200 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">3 Background Checks Pending</p>
                    <button className="text-green-600 hover:text-green-700 text-xs font-semibold mt-1">
                      Check status →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6">Job Management</h2>
            <div className="flex gap-2">
              {['All', 'Pending', 'In Progress', 'Completed'].map((filter, i) => (
                <button
                  key={filter}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    i === 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cleaners' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6">Cleaner Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 text-gray-500 font-medium">Name</th>
                    <th className="text-left py-3 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-3 text-gray-500 font-medium">Jobs</th>
                    <th className="text-left py-3 text-gray-500 font-medium">Rating</th>
                    <th className="text-left py-3 text-gray-500 font-medium">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Maria Garcia', status: 'Active', jobs: 24, rating: '4.9★', earnings: '$1,240' },
                    { name: 'James Wilson', status: 'Active', jobs: 18, rating: '4.8★', earnings: '$890' },
                    { name: 'Sofia Martinez', status: 'Pending', jobs: 0, rating: '—', earnings: '$0' },
                  ].map((cleaner) => (
                    <tr key={cleaner.name} className="border-b border-gray-50">
                      <td className="py-3 font-medium text-gray-900">{cleaner.name}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          cleaner.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Client Management</h2>
            <p className="text-gray-600 text-sm">View client accounts, bookings, and feedback.</p>
          </div>
        )}
      </div>
    </div>
  );
}
