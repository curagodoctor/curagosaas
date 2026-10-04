'use client';

import { useState, useEffect, useCallback } from 'react';

// One place for all per-doctor Practice OS admin controls: Dominate Organic Search
// access (7/28-day, extend, permanent, revoke), AI credits, pack grant/revoke, and
// progress tracking. Used inside the unified doctor detail page.
export default function DoctorPracticeOsTab({ doctorId }) {
  const [dos, setDos] = useState(null);
  const [data, setData] = useState(null);      // /practice-os/users/[id]
  const [credits, setCredits] = useState(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const [d, u, c] = await Promise.all([
        fetch(`/api/platform/doctors/${doctorId}/dos-access`).then((r) => r.json()).catch(() => null),
        fetch(`/api/platform/practice-os/users/${doctorId}`).then((r) => r.json()).catch(() => null),
        fetch(`/api/platform/practice-os/doctors/${doctorId}/credits`).then((r) => r.json()).catch(() => null),
      ]);
      if (d?.success) setDos(d);
      if (u) setData(u);
      if (c) setCredits(c);
    } catch { /* ignore */ }
  }, [doctorId]);
  useEffect(() => { load(); }, [load]);

  const dosAction = async (action, days) => {
    setBusy(`dos-${action}-${days || ''}`); setMsg('');
    try {
      const r = await fetch(`/api/platform/doctors/${doctorId}/dos-access`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, days }),
      }).then((x) => x.json());
      if (!r.success) setMsg(r.error || 'Failed');
      await load();
    } finally { setBusy(''); }
  };

  const packAction = async (frameworkId, action) => {
    setBusy(`pack-${frameworkId}-${action}`); setMsg('');
    try {
      await fetch(`/api/platform/practice-os/users/${doctorId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, frameworkId }),
      });
      await load();
    } finally { setBusy(''); }
  };

  const saveCredits = async (patch) => {
    setBusy('credits'); setMsg('');
    try {
      const r = await fetch(`/api/platform/practice-os/doctors/${doctorId}/credits`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }).then((x) => x.json());
      if (r?.success === false) setMsg(r.error || 'Failed');
      await load();
    } finally { setBusy(''); }
  };

  const Card = ({ title, children, right }) => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
  const Btn = ({ onClick, children, kind = 'neutral', k }) => (
    <button onClick={onClick} disabled={!!busy}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 ${
        kind === 'primary' ? 'bg-[#096b17] text-white hover:bg-[#075110]'
          : kind === 'danger' ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
      {busy === k ? '…' : children}
    </button>
  );

  const enr = data?.enrollment;
  const packs = data?.packs || [];
  const ownedIds = new Set((data?.ownedPackIds || []).map(String));
  const progress = data?.progress || [];
  const perf = data?.performance;

  return (
    <div className="space-y-6">
      {msg && <div className="text-sm text-red-600">{msg}</div>}

      {/* Dominate Organic Search access */}
      <Card title="Dominate Organic Search access" right={
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
          dos?.phase === 'active' ? 'bg-green-100 text-green-800'
            : dos?.phase === 'grace' ? 'bg-amber-100 text-amber-800'
            : 'bg-gray-100 text-gray-600'}`}>{dos?.phase || '…'}</span>
      }>
        <p className="text-sm text-gray-700 mb-3">
          {!dos ? 'Loading…'
            : dos.subscribed ? 'Active ₹5,000/mo subscription.'
            : dos.permanent ? 'Permanent access (founder-style comp).'
            : dos.granted && dos.expiresAt
              ? `${dos.grantLengthDays || '?'}-day access · ${dos.daysLeft > 0 ? `${dos.daysLeft} day(s) left` : 'expired'} (until ${new Date(dos.expiresAt).toLocaleDateString()}).`
              : 'No access.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => dosAction('grant', 7)} k="dos-grant-7" kind="primary">Grant 7 days</Btn>
          <Btn onClick={() => dosAction('grant', 28)} k="dos-grant-28" kind="primary">Grant 28 days</Btn>
          <Btn onClick={() => dosAction('extend', 7)} k="dos-extend-7">+7 days</Btn>
          <Btn onClick={() => dosAction('extend', 28)} k="dos-extend-28">+28 days</Btn>
          {!dos?.permanent && <Btn onClick={() => dosAction('permanent')} k="dos-permanent-">Make permanent</Btn>}
          {(dos?.granted || dos?.permanent) && <Btn onClick={() => dosAction('revoke')} k="dos-revoke-" kind="danger">Revoke</Btn>}
        </div>
      </Card>

      {/* AI credits */}
      <Card title="AI credits">
        {!credits ? <p className="text-sm text-gray-500">Loading…</p> : (
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" defaultChecked={!!credits.unlimited}
                onChange={(e) => saveCredits({ unlimited: e.target.checked })} className="w-4 h-4" />
              Unlimited
            </label>
            <label className="text-sm text-gray-700">
              <span className="block text-xs text-gray-500 mb-1">Daily limit</span>
              <input type="number" defaultValue={credits.dailyLimit ?? 0} id="dl"
                className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg" />
            </label>
            <label className="text-sm text-gray-700">
              <span className="block text-xs text-gray-500 mb-1">Remaining now</span>
              <input type="number" defaultValue={credits.dailyBalance ?? 0} id="db"
                className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg" />
            </label>
            <Btn onClick={() => saveCredits({
              dailyLimit: Number(document.getElementById('dl')?.value) || 0,
              dailyBalance: Number(document.getElementById('db')?.value) || 0,
            })} k="credits" kind="primary">Save credits</Btn>
          </div>
        )}
      </Card>

      {/* Packs */}
      <Card title="Packs">
        {!packs.length ? <p className="text-sm text-gray-500">No packs in the catalogue.</p> : (
          <div className="space-y-2">
            {packs.map((p) => {
              const owned = ownedIds.has(String(p.id || p._id));
              const fid = String(p.id || p._id);
              return (
                <div key={fid} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-900">
                    {p.title}
                    <span className="text-xs text-gray-500"> · {p.priceInInr > 0 ? `₹${p.priceInInr}` : 'Free'}</span>
                    {owned && <span className="text-xs font-medium text-green-700"> · Owned</span>}
                  </span>
                  <span className="flex items-center gap-2">
                    {owned
                      ? <Btn onClick={() => packAction(fid, 'revoke')} k={`pack-${fid}-revoke`} kind="danger">Revoke</Btn>
                      : <Btn onClick={() => packAction(fid, 'grant')} k={`pack-${fid}-grant`} kind="primary">Grant</Btn>}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Tracking */}
      <Card title="Tracking">
        {!enr ? <p className="text-sm text-gray-500">Not enrolled in any pack yet.</p> : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <Stat label="Status" value={enr.status} />
              <Stat label="Days completed" value={`${enr.daysCompleted || 0}`} />
              <Stat label="Performance" value={perf?.overallScore ?? '—'} />
              <Stat label="Streak" value={perf?.currentStreak ?? '—'} />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-2">Mission progress ({progress.length})</p>
            <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
              {progress.length ? progress.map((m, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-gray-700 truncate">{m.missionText || m.title || `Mission ${m.dayNumber || i + 1}`}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    m.status === 'completed' ? 'bg-green-100 text-green-700'
                      : m.status === 'skipped' ? 'bg-gray-200 text-gray-600'
                      : 'bg-amber-100 text-amber-700'}`}>{m.status || 'pending'}</span>
                </div>
              )) : <p className="px-3 py-2 text-sm text-gray-500">No mission activity yet.</p>}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-lg font-semibold text-gray-900 capitalize">{String(value)}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
