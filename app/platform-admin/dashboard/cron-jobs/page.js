'use client';

import { useState, useEffect, Fragment } from 'react';

const when = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');
const dur = (ms) => (ms ? `${(ms / 1000).toFixed(1)}s` : '—');
const JOB_LABEL = {
  'practice-os-daily-tasks': 'Daily task autorun (email + content)',
  'practice-os-prewarm': 'Content prewarm',
  'practice-os-reminders': 'Reminders',
};

function Pill({ ok, children }) {
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{children}</span>;
}
function YesNo({ v }) {
  return <span className={v ? 'text-green-600' : 'text-gray-300'}>{v ? '✓' : '—'}</span>;
}

export default function CronJobsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null); // expanded run id

  const load = () => {
    setLoading(true);
    fetch('/api/platform/cron-jobs', { credentials: 'include' })
      .then((r) => r.json()).then((d) => { if (d.success) setData(d); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  if (loading && !data) return <div className="py-16 text-center text-gray-500">Loading job runs…</div>;
  if (!data) return <div className="py-16 text-center text-red-600">Could not load job runs.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Scheduler / cron runs — did each job run, did it succeed, and (per doctor) was a draft/image generated and the email sent.</p>
        </div>
        <button onClick={load} className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50">Refresh</button>
      </div>

      {/* Latest status per job */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {data.jobs.length === 0 && <p className="text-gray-400 text-sm col-span-3">No runs recorded yet — jobs will appear here after their next run.</p>}
        {data.jobs.map((j) => (
          <div key={j.job} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">{JOB_LABEL[j.job] || j.job}</p>
              <Pill ok={j.ok}>{j.ok ? 'OK' : 'FAILED'}</Pill>
            </div>
            <p className="text-xs text-gray-500 mt-1">Last run {when(j.at)}</p>
            {j.counts && (
              <p className="text-xs text-gray-600 mt-1.5">{Object.entries(j.counts).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>
            )}
            {j.error && <p className="text-xs text-red-600 mt-1 truncate">{j.error}</p>}
          </div>
        ))}
      </div>

      {/* Run history */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Run history</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-3 py-2">When</th>
                <th className="text-left font-semibold px-3 py-2">Job</th>
                <th className="text-left font-semibold px-3 py-2">Status</th>
                <th className="text-left font-semibold px-3 py-2">Summary</th>
                <th className="text-right font-semibold px-3 py-2">Duration</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.runs.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No runs yet.</td></tr>}
              {data.runs.map((r) => (
                <Fragment key={r.id}>
                  <tr>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{when(r.startedAt)}</td>
                    <td className="px-3 py-2 text-gray-800">{JOB_LABEL[r.job] || r.job}</td>
                    <td className="px-3 py-2"><Pill ok={r.ok}>{r.ok ? 'OK' : 'FAILED'}</Pill></td>
                    <td className="px-3 py-2 text-gray-600 text-xs">{r.error ? <span className="text-red-600">{r.error}</span> : Object.entries(r.counts).map(([k, v]) => `${k}: ${v}`).join(' · ')}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-600">{dur(r.durationMs)}</td>
                    <td className="px-3 py-2 text-right">
                      {r.results.length > 0 && <button onClick={() => setOpen(open === r.id ? null : r.id)} className="text-[#096b17] text-xs font-medium hover:underline">{open === r.id ? 'Hide' : `${r.results.length} doctors`}</button>}
                    </td>
                  </tr>
                  {open === r.id && (
                    <tr>
                      <td colSpan={6} className="px-3 py-2 bg-gray-50">
                        <table className="w-full text-xs">
                          <thead className="text-gray-400">
                            <tr><th className="text-left py-1 px-2">Doctor</th><th className="py-1 px-2">Draft</th><th className="py-1 px-2">Image</th><th className="py-1 px-2">Email</th><th className="text-left py-1 px-2">Outcome</th></tr>
                          </thead>
                          <tbody>
                            {r.results.map((x, i) => (
                              <tr key={i} className="border-t border-gray-100">
                                <td className="py-1 px-2 text-gray-800">{x.name}</td>
                                <td className="py-1 px-2 text-center"><YesNo v={x.draft} /></td>
                                <td className="py-1 px-2 text-center"><YesNo v={x.image} /></td>
                                <td className="py-1 px-2 text-center"><YesNo v={x.email} /></td>
                                <td className={`py-1 px-2 ${x.ok ? 'text-gray-600' : 'text-red-600'}`}>{x.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5">Per-doctor detail is captured for the daily task autorun (draft/image/email). “Image ✓” means a featured image was generated for that doctor's content.</p>
      </div>
    </div>
  );
}
