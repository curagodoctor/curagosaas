'use client';

import { useState, useEffect, useCallback } from 'react';

export default function TeamPage() {
  const [admins, setAdmins] = useState([]);
  const [me, setMe] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add-admin form
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Reset-password modal
  const [resetFor, setResetFor] = useState(null); // admin object
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [teamRes, meRes] = await Promise.all([
        fetch('/api/platform/team', { credentials: 'include' }),
        fetch('/api/platform/auth/me', { credentials: 'include' }),
      ]);
      const team = await teamRes.json();
      const meData = await meRes.json();
      if (team.success) setAdmins(team.admins || []);
      else setError(team.error || 'Failed to load team');
      setMe((meData?.admin?.email || '').toLowerCase());
    } catch {
      setError('Failed to load team');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addAdmin = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = await fetch('/api/platform/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Failed to add admin'); setSaving(false); return; }
      setForm({ name: '', email: '', password: '' });
      setShowAdd(false);
      await load();
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (admin) => {
    const res = await fetch(`/api/platform/team/${admin._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ active: !admin.active }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed to update'); return; }
    load();
  };

  const removeAdmin = async (admin) => {
    if (!confirm(`Remove ${admin.email} from the admin portal? This cannot be undone.`)) return;
    const res = await fetch(`/api/platform/team/${admin._id}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed to remove'); return; }
    load();
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetting(true);
    try {
      const res = await fetch(`/api/platform/team/${resetFor._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setResetError(data.error || 'Failed to reset password'); setResetting(false); return; }
      setResetFor(null);
      setNewPassword('');
    } catch {
      setResetError('Something went wrong. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-1">People who can sign in to the admin portal.</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setFormError(''); }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Add admin
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : admins.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No admins yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const isSelf = a.email === me;
                return (
                  <tr key={a._id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3 text-gray-900">
                      {a.name || '—'}
                      {isSelf && <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">You</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{a.email}</td>
                    <td className="px-5 py-3">
                      {a.active ? (
                        <span className="inline-flex items-center gap-1.5 text-green-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setResetFor(a); setNewPassword(''); setResetError(''); }}
                          className="px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          Reset password
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => toggleActive(a)}
                            className="px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            {a.active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                        {!isSelf && (
                          <button
                            onClick={() => removeAdmin(a)}
                            className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add admin modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add admin</h2>
            {formError && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{formError}</div>}
            <form onSubmit={addAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Temporary password</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="At least 8 characters"
                  required
                />
                <p className="mt-1.5 text-xs text-gray-400">They sign in with this + an email code. Share it securely; they can change it later.</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                  {saving ? 'Adding…' : 'Add admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setResetFor(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Reset password</h2>
            <p className="text-sm text-gray-500 mb-4">{resetFor.email}</p>
            {resetError && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{resetError}</div>}
            <form onSubmit={submitReset} className="space-y-4">
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="New password (min 8 characters)"
                autoFocus
                required
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setResetFor(null)} className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={resetting} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                  {resetting ? 'Saving…' : 'Set password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
