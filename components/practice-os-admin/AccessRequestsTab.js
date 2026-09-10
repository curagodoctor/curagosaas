'use client';

import { useState, useEffect, useCallback } from 'react';

// §7 admin — review doctors' optimization access requests and grant/deny.
// Granting flips their optimizationAccess flag (the doctor-side boundary).
export default function AccessRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter === 'all' ? '' : `?status=${filter}`;
      const res = await fetch(`/api/platform/practice-os/access-requests${qs}`);
      const data = await res.json();
      if (data.success) setRequests(data.requests || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const decide = async (id, action) => {
    setBusyId(id);
    try {
      const res = await fetch('/api/platform/practice-os/access-requests', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if ((await res.json()).success) await load();
    } catch { /* ignore */ } finally { setBusyId(''); }
  };

  const badge = (s) => ({
    pending: 'bg-amber-100 text-amber-800',
    granted: 'bg-green-100 text-green-800',
    denied: 'bg-gray-200 text-gray-600',
  }[s] || 'bg-gray-100 text-gray-600');

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">Access requests</h2>
          <p className="text-sm text-gray-500 mt-0.5">Doctors asking to unlock the optimization work. Grant to open it up for them.</p>
        </div>
        <div className="flex gap-1">
          {['pending', 'granted', 'denied', 'all'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize ${filter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-gray-400">No {filter === 'all' ? '' : filter} requests.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{r.name || 'Unknown'}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${badge(r.status)}`}>{r.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[r.specialty, r.city].filter(Boolean).join(' · ') || '—'} · {r.phone || 'no phone'} · {r.email || 'no email'}
                  </p>
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => decide(r._id, 'grant')} disabled={busyId === r._id}
                      className="px-3 py-1.5 bg-[#096b17] text-white rounded-lg text-sm font-medium disabled:opacity-50">Grant</button>
                    <button onClick={() => decide(r._id, 'deny')} disabled={busyId === r._id}
                      className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm disabled:opacity-50">Deny</button>
                  </div>
                )}
                {r.status === 'granted' && (
                  <button onClick={() => decide(r._id, 'deny')} disabled={busyId === r._id}
                    className="px-3 py-1.5 border border-gray-300 text-gray-500 rounded-lg text-xs shrink-0 disabled:opacity-50">Revoke</button>
                )}
              </div>
              {(r.challenge || r.goal) && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5 text-sm">
                  {r.challenge && <p className="text-gray-600"><span className="text-gray-400">Challenge:</span> {r.challenge}</p>}
                  {r.goal && <p className="text-gray-600"><span className="text-gray-400">Goal:</span> {r.goal}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
