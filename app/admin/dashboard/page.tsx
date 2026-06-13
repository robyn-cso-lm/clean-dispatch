'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Cleaner = {
  id: string;
  name: string;
  email: string;
  phone: string;
  backgroundCheckStatus: string;
  checkrStatus: string;
  rating: number;
  reviewCount: number;
  totalHours: number;
  createdAt: string;
  _count: { jobs: number };
  workPhotos: { id: string; driveItemId: string }[];
  payouts: { amount: number; status: string }[];
};

type Job = {
  id: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  quoteAmount: number;
  status: string;
  client: { name: string; email: string };
  assignment?: { cleaner: { name: string } } | null;
};

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  createdAt: string;
  _count: { jobs: number };
};

type Plan = {
  id: string;
  serviceType: string;
  frequency: string;
  status: string;
  nextDate: string;
  tipAmount: number;
  client: { name: string; email: string };
  preferredCleaner: { name: string } | null;
  _count: { jobs: number };
};

type Overview = {
  totalCleaners: number;
  pendingCleaners: number;
  totalJobs: number;
  recentJobs: Job[];
  totalRevenue: number;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
    paid: 'bg-green-100 text-green-800',
    assigned: 'bg-blue-100 text-blue-800',
    accepted: 'bg-blue-100 text-blue-800',
    completed: 'bg-gray-100 text-gray-800',
    quoted: 'bg-gray-100 text-gray-600',
    failed: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'cleaners' | 'clients' | 'recurring'>('overview');
  const [signingOut, setSigningOut] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [cleaners, setCleaners] = useState<Cleaner[] | null>(null);
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [clients, setClients] = useState<Client[] | null>(null);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [planBusy, setPlanBusy] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [sendMsg, setSendMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/data?type=${type}`);
      const data = await res.json();
      if (type === 'overview') setOverview(data);
      if (type === 'cleaners') setCleaners(data.cleaners);
      if (type === 'jobs') setJobs(data.jobs);
      if (type === 'clients') setClients(data.clients);
      if (type === 'recurring') setPlans(data.plans);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData('overview');
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'cleaners' && !cleaners) fetchData('cleaners');
    if (activeTab === 'jobs' && !jobs) fetchData('jobs');
    if (activeTab === 'clients' && !clients) fetchData('clients');
    if (activeTab === 'recurring' && !plans) fetchData('recurring');
  }, [activeTab, cleaners, jobs, clients, plans, fetchData]);

  async function updatePlan(planId: string, action: 'pause' | 'resume' | 'cancel') {
    setPlanBusy(planId);
    try {
      const res = await fetch('/api/admin/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, action }),
      });
      if (res.ok) {
        setPlans(null);
        await fetchData('recurring');
      }
    } finally {
      setPlanBusy(null);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  async function approveCleaner(cleanerId: string, force = false) {
    setApprovingId(cleanerId);
    try {
      const res = await fetch('/api/admin/cleaners/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanerId, force }),
      });
      if (res.ok) {
        // Refresh cleaners list and overview
        setCleaners(null);
        setOverview(null);
        await Promise.all([fetchData('cleaners'), fetchData('overview')]);
        return;
      }
      const data = await res.json();
      if (res.status === 422 && data.canForce) {
        const ok = window.confirm(`${data.error}\n\nApprove anyway (override)?`);
        if (ok) {
          await approveCleaner(cleanerId, true);
          return;
        }
      } else {
        window.alert(data.error ?? 'Failed to approve.');
      }
    } finally {
      setApprovingId(null);
    }
  }

  async function requestCompletion(opts: { cleanerId?: string; all?: boolean }) {
    setRequestingId(opts.all ? 'all' : opts.cleanerId ?? null);
    setSendMsg('');
    try {
      const res = await fetch('/api/admin/cleaners/request-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendMsg(data.error ?? 'Failed to send.');
        return;
      }
      const results = (data.results ?? []) as { emailSent: boolean }[];
      const failed = results.filter((r) => !r.emailSent).length;
      setSendMsg(
        failed > 0
          ? `Sent ${data.sent}/${data.total}. ${failed} failed — email may not be configured yet (set GRAPH_* in Railway).`
          : `Onboarding email sent to ${data.sent} cleaner${data.sent === 1 ? '' : 's'} ✓`
      );
      setCleaners(null);
      await fetchData('cleaners');
    } catch {
      setSendMsg('Network error sending emails.');
    } finally {
      setRequestingId(null);
    }
  }

  function CheckBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
      clear: 'bg-green-100 text-green-800',
      consider: 'bg-orange-100 text-orange-800',
      suspended: 'bg-red-100 text-red-800',
      invitation_sent: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      none: 'bg-gray-100 text-gray-500',
    };
    const label: Record<string, string> = {
      clear: 'Check: clear',
      consider: 'Check: consider',
      suspended: 'Check: suspended',
      invitation_sent: 'Check: invite sent',
      pending: 'Check: pending',
      error: 'Check: error',
      none: 'Check: not started',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${map[status] ?? map.none}`}>
        {label[status] ?? `Check: ${status}`}
      </span>
    );
  }

  const pendingCount = overview?.pendingCleaners ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin nav */}
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
          {[
            {
              label: 'Total Revenue',
              value: overview ? `$${overview.totalRevenue.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—',
            },
            { label: 'Active Cleaners', value: overview?.totalCleaners ?? '—' },
            { label: 'Total Jobs', value: overview?.totalJobs ?? '—' },
            {
              label: 'Pending Approvals',
              value: overview?.pendingCleaners ?? '—',
              alert: (overview?.pendingCleaners ?? 0) > 0,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-white rounded-xl p-6 shadow-sm border ${stat.alert ? 'border-yellow-300' : 'border-gray-100'}`}
            >
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wide">{stat.label}</div>
              <div className={`text-2xl font-bold mt-2 ${stat.alert ? 'text-yellow-600' : 'text-gray-900'}`}>
                {String(stat.value)}
              </div>
              {stat.alert && (
                <div className="text-xs text-yellow-600 mt-1 font-medium">Needs review</div>
              )}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-8">
          {(['overview', 'jobs', 'cleaners', 'clients', 'recurring'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 pb-3 pt-1 font-semibold capitalize text-sm transition-colors relative ${
                activeTab === tab
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab}
              {tab === 'cleaners' && pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-yellow-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Jobs</h2>
              {loading || !overview ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : overview.recentJobs.length === 0 ? (
                <p className="text-sm text-gray-500">No jobs yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 text-gray-500 font-medium">Client</th>
                        <th className="text-left py-3 text-gray-500 font-medium">Cleaner</th>
                        <th className="text-left py-3 text-gray-500 font-medium">Service</th>
                        <th className="text-left py-3 text-gray-500 font-medium">Date</th>
                        <th className="text-left py-3 text-gray-500 font-medium">Amount</th>
                        <th className="text-left py-3 text-gray-500 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.recentJobs.map((job) => (
                        <tr key={job.id} className="border-b border-gray-50">
                          <td className="py-3 font-medium text-gray-900">{job.client.name}</td>
                          <td className="py-3 text-gray-600">{job.assignment?.cleaner.name ?? '—'}</td>
                          <td className="py-3 text-gray-600 capitalize">{job.serviceType}</td>
                          <td className="py-3 text-gray-600">
                            {new Date(job.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-3 font-semibold text-green-600">${job.quoteAmount}</td>
                          <td className="py-3"><StatusBadge status={job.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {pendingCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {pendingCount} cleaner application{pendingCount > 1 ? 's' : ''} pending review
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      New applicants are waiting for background check approval before they can receive jobs.
                    </p>
                    <button
                      onClick={() => setActiveTab('cleaners')}
                      className="mt-3 text-sm font-semibold text-green-600 hover:text-green-700"
                    >
                      Review applications →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6">All Jobs</h2>
            {loading || !jobs ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-gray-500">No jobs yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 text-gray-500 font-medium">Client</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Service</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Date</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Time</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Cleaner</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Amount</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id} className="border-b border-gray-50">
                        <td className="py-3 font-medium text-gray-900">{job.client.name}</td>
                        <td className="py-3 text-gray-600 capitalize">{job.serviceType.replace('-', ' ')}</td>
                        <td className="py-3 text-gray-600">
                          {new Date(job.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3 text-gray-600">{job.scheduledTime}</td>
                        <td className="py-3 text-gray-600">{job.assignment?.cleaner.name ?? <span className="text-yellow-600 font-medium">Unassigned</span>}</td>
                        <td className="py-3 font-semibold text-gray-900">${job.quoteAmount}</td>
                        <td className="py-3"><StatusBadge status={job.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Cleaners Tab */}
        {activeTab === 'cleaners' && (
          <div className="space-y-4">
            {/* Pending applications */}
            {cleaners && cleaners.filter(c => c.backgroundCheckStatus === 'pending').length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-bold">Pending</span>
                  New Applications
                </h2>
                <div className="space-y-3">
                  {cleaners.filter(c => c.backgroundCheckStatus === 'pending').map((cleaner) => (
                    <div key={cleaner.id} className="p-4 border border-yellow-100 bg-yellow-50 rounded-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">{cleaner.name}</p>
                          <p className="text-sm text-gray-600">{cleaner.email} · {cleaner.phone}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <CheckBadge status={cleaner.checkrStatus} />
                            <span className={`text-xs font-medium ${cleaner.workPhotos.length > 0 ? 'text-gray-600' : 'text-red-600'}`}>
                              {cleaner.workPhotos.length} work photo{cleaner.workPhotos.length === 1 ? '' : 's'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Applied {new Date(cleaner.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <button
                          onClick={() => approveCleaner(cleaner.id)}
                          disabled={approvingId === cleaner.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                          {approvingId === cleaner.id ? 'Approving…' : 'Approve ✓'}
                        </button>
                      </div>
                      {cleaner.workPhotos.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {cleaner.workPhotos.map((p) => (
                            <a key={p.id} href={`/api/files/${p.driveItemId}`} target="_blank" rel="noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`/api/files/${p.driveItemId}`}
                                alt="Work sample"
                                className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:ring-2 hover:ring-green-500 transition"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All cleaners table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <h2 className="text-base font-semibold text-gray-900">All Cleaners</h2>
                <button
                  onClick={() => requestCompletion({ all: true })}
                  disabled={requestingId === 'all'}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  title="Emails everyone still missing work photos or a background check"
                >
                  {requestingId === 'all' ? 'Sending…' : '✉️ Email cleaners to finish onboarding'}
                </button>
              </div>
              {sendMsg && (
                <p className="text-sm text-gray-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2 mb-4">{sendMsg}</p>
              )}
              {loading || !cleaners ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : cleaners.length === 0 ? (
                <p className="text-sm text-gray-500">No cleaners yet. Share your recruitment links!</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 text-gray-500 font-medium">Name</th>
                        <th className="text-left py-3 text-gray-500 font-medium">Contact</th>
                        <th className="text-left py-3 text-gray-500 font-medium">Status</th>
                        <th className="text-left py-3 text-gray-500 font-medium">Jobs</th>
                        <th className="text-left py-3 text-gray-500 font-medium">Rating</th>
                        <th className="text-left py-3 text-gray-500 font-medium">Total Hrs</th>
                        <th className="text-left py-3 text-gray-500 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cleaners.map((cleaner) => (
                        <tr key={cleaner.id} className="border-b border-gray-50">
                          <td className="py-3 font-medium text-gray-900">{cleaner.name}</td>
                          <td className="py-3 text-gray-500 text-xs">
                            <div>{cleaner.email}</div>
                            <div>{cleaner.phone}</div>
                          </td>
                          <td className="py-3"><StatusBadge status={cleaner.backgroundCheckStatus} /></td>
                          <td className="py-3 text-gray-600">{cleaner._count.jobs}</td>
                          <td className="py-3 text-gray-600">
                            {cleaner.reviewCount > 0 ? `${cleaner.rating.toFixed(1)}★` : '—'}
                          </td>
                          <td className="py-3 text-gray-600">{cleaner.totalHours}h</td>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              {cleaner.backgroundCheckStatus === 'pending' && (
                                <button
                                  onClick={() => approveCleaner(cleaner.id)}
                                  disabled={approvingId === cleaner.id}
                                  className="text-green-600 hover:text-green-700 font-semibold text-xs disabled:opacity-50"
                                >
                                  {approvingId === cleaner.id ? 'Approving…' : 'Approve'}
                                </button>
                              )}
                              <button
                                onClick={() => requestCompletion({ cleanerId: cleaner.id })}
                                disabled={requestingId === cleaner.id}
                                className="text-gray-500 hover:text-gray-900 font-semibold text-xs disabled:opacity-50"
                                title="Email this cleaner a link to finish onboarding"
                              >
                                {requestingId === cleaner.id ? 'Sending…' : '✉️ Email'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6">All Clients</h2>
            {loading || !clients ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : clients.length === 0 ? (
              <p className="text-sm text-gray-500">No clients yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 text-gray-500 font-medium">Name</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Email</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Phone</th>
                      <th className="text-left py-3 text-gray-500 font-medium">City</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Jobs</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Since</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.id} className="border-b border-gray-50">
                        <td className="py-3 font-medium text-gray-900">{client.name}</td>
                        <td className="py-3 text-gray-600">{client.email}</td>
                        <td className="py-3 text-gray-600">{client.phone}</td>
                        <td className="py-3 text-gray-600">{client.city}</td>
                        <td className="py-3 text-gray-600">{client._count.jobs}</td>
                        <td className="py-3 text-gray-400 text-xs">
                          {new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Recurring Tab */}
        {activeTab === 'recurring' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6">Recurring Plans</h2>
            {loading || !plans ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : plans.length === 0 ? (
              <p className="text-sm text-gray-500">No recurring plans yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 text-gray-500 font-medium">Client</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Service</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Frequency</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Next visit</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Visits</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Status</th>
                      <th className="text-left py-3 text-gray-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((p) => (
                      <tr key={p.id} className="border-b border-gray-50">
                        <td className="py-3 font-medium text-gray-900">{p.client.name}</td>
                        <td className="py-3 text-gray-600 capitalize">{p.serviceType.replace('-', ' ')}</td>
                        <td className="py-3 text-gray-600 capitalize">{p.frequency}</td>
                        <td className="py-3 text-gray-600">
                          {new Date(p.nextDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3 text-gray-600">{p._count.jobs}</td>
                        <td className="py-3"><StatusBadge status={p.status} /></td>
                        <td className="py-3">
                          {p.status !== 'cancelled' && (
                            <div className="flex items-center gap-3 text-xs font-semibold">
                              {p.status === 'active' ? (
                                <button onClick={() => updatePlan(p.id, 'pause')} disabled={planBusy === p.id} className="text-gray-500 hover:text-gray-900 disabled:opacity-50">Pause</button>
                              ) : (
                                <button onClick={() => updatePlan(p.id, 'resume')} disabled={planBusy === p.id} className="text-green-600 hover:text-green-700 disabled:opacity-50">Resume</button>
                              )}
                              <button onClick={() => { if (window.confirm('Cancel this recurring plan?')) updatePlan(p.id, 'cancel'); }} disabled={planBusy === p.id} className="text-coral-600 hover:text-coral-700 disabled:opacity-50">Cancel</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
