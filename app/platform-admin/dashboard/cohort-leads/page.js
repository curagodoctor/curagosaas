'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { QUESTIONS } from '@/lib/cohortQuestions';

const RESULT_META = {
  strong_fit: { label: 'Strong fit', color: 'bg-green-100 text-green-800', dot: '#3fbf5f' },
  maybe: { label: 'Maybe', color: 'bg-amber-100 text-amber-800', dot: '#f2c317' },
  not_fit: { label: 'Not fit', color: 'bg-red-100 text-red-700', dot: '#e0503f' },
  '': { label: 'Incomplete', color: 'bg-gray-100 text-gray-500', dot: '#c9c9c9' },
};
const STATUSES = ['new', 'reviewing', 'onboarded', 'declined'];
const QLABEL = Object.fromEntries(QUESTIONS.map((q) => [q.id, q.title]));

export default function CohortLeadsPage() {
  const [data, setData] = useState(null);
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('');
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams();
    if (result) qs.set('result', result);
    if (status) qs.set('status', status);
    const res = await fetch(`/api/platform/cohort-leads?${qs}`);
    const json = await res.json();
    if (json.success) setData(json);
  }, [result, status]);
  useEffect(() => { load(); }, [load]);

  const setLeadStatus = async (id, s) => {
    await fetch('/api/platform/cohort-leads', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: s }) });
    load();
  };

  const f = data?.funnel;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cohort Leads</h1>
          <p className="text-gray-500 text-sm mt-0.5">Fit-assessment submissions from the &ldquo;See if it&apos;s the right fit&rdquo; flow.</p>
        </div>
        <a href={`/api/platform/cohort-leads?format=csv${result ? `&result=${result}` : ''}${status ? `&status=${status}` : ''}`} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
          Export CSV
        </a>
      </div>

      {/* Funnel */}
      {f && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            ['Started', f.started], ['Completed', f.completed], ['Clicked Join', f.joined],
            ['Strong fit', f.strong], ['Maybe', f.maybe], ['Not fit', f.notfit], ['Total', f.total],
          ].map(([label, n]) => (
            <div key={label} className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-2xl font-bold text-gray-900">{n}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={result} onChange={(e) => setResult(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">All results</option>
          <option value="strong_fit">Strong fit</option>
          <option value="maybe">Maybe</option>
          <option value="not_fit">Not fit</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3">Doctor</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Result</th>
                <th className="px-5 py-3">Funnel</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!data ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Loading…</td></tr>
              ) : data.leads.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-500">No leads yet.</td></tr>
              ) : data.leads.map((l) => {
                const rm = RESULT_META[l.result] || RESULT_META[''];
                const open = expanded === l._id;
                return (
                  <Fragment key={l._id}>
                    <tr className="hover:bg-gray-50 align-top">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{l.name || '—'}</p>
                        <p className="text-xs text-gray-500">{l.specialty || ''}{l.city ? ` · ${l.city}` : ''}</p>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        <p>{l.email}</p>
                        {l.phone && <a href={`https://wa.me/${l.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">{l.phone}</a>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${rm.color}`}>
                          <span className="w-2 h-2 rounded-full" style={{ background: rm.dot }} />{rm.label}
                        </span>
                        {l.reason && <p className="text-[11px] text-gray-400 mt-1 max-w-[220px]">{l.reason}</p>}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        <span className={l.completedAt ? 'text-gray-700' : ''}>{l.completedAt ? '✓ Completed' : '… Started'}</span>
                        {l.clickedJoinCohort && <p className="text-green-600 font-medium">Clicked Join{l.chosenPath ? ` (${l.chosenPath})` : ''}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <select value={l.status} onChange={(e) => setLeadStatus(l._id, e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white">
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => setExpanded(open ? null : l._id)} className="text-sm text-blue-600 hover:underline">{open ? 'Hide' : 'Answers'}</button>
                      </td>
                    </tr>
                    {open && (
                      <tr>
                        <td colSpan={6} className="px-5 py-4 bg-gray-50">
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                            {Object.entries(l.answers || {}).map(([k, v]) => (
                              <div key={k} className="text-sm">
                                <dt className="text-xs text-gray-500">{QLABEL[k] || k}</dt>
                                <dd className="text-gray-800">{Array.isArray(v) ? v.join(', ') : String(v)}</dd>
                              </div>
                            ))}
                          </dl>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
