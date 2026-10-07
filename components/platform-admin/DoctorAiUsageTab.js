'use client';

import { useState, useEffect } from 'react';

const fmt = (n) => (n || 0).toLocaleString('en-IN');
const inr = (n) => `₹${(Math.round((n || 0) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export default function DoctorAiUsageTab({ doctorId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/platform/doctors/${doctorId}/ai-usage`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (!alive) return; if (d.success) setData(d); else setErr(d.error || 'Failed to load'); })
      .catch(() => alive && setErr('Failed to load'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [doctorId]);

  if (loading) return <div className="py-12 text-center text-gray-500">Loading AI usage…</div>;
  if (err) return <div className="py-12 text-center text-red-600">{err}</div>;

  const u = data.usage;
  const ledger = data.ledger;
  const Card = ({ label, value, sub }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card label="Total cost" value={inr(u.totals.costInInr)} sub={`${fmt(u.totals.requests)} requests`} />
        <Card label="Total tokens" value={fmt(u.totals.totalTokens)} sub={`${fmt(u.totals.images)} images`} />
        <Card label="Today" value={inr(u.today.costInInr)} sub={`${fmt(u.today.requests)} requests`} />
        <Card label="Last 30 days" value={inr(u.last30d.costInInr)} sub={`${fmt(u.last30d.requests)} requests`} />
      </div>

      {/* By model */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">By model</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-3 py-2">Model</th>
                <th className="text-left font-semibold px-3 py-2">Type</th>
                <th className="text-right font-semibold px-3 py-2">Requests</th>
                <th className="text-right font-semibold px-3 py-2">Tokens</th>
                <th className="text-right font-semibold px-3 py-2">Images</th>
                <th className="text-right font-semibold px-3 py-2">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {u.byModel.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No AI usage recorded yet.</td></tr>
              )}
              {u.byModel.map((r, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 font-mono text-[13px] text-gray-900">{r.model}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${r.kind === 'image' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{r.kind}</span></td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(r.requests)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.kind === 'image' ? '—' : fmt(r.totalTokens)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.kind === 'image' ? fmt(r.images) : '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{inr(r.costInInr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5">Costs are estimates from OpenAI list prices (USD→INR at ₹{u.usdToInr}/$). Text billed on tokens; images per generation.</p>
      </div>

      {/* Recent requests */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Recent requests</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-3 py-2">When</th>
                <th className="text-left font-semibold px-3 py-2">Source</th>
                <th className="text-left font-semibold px-3 py-2">Model</th>
                <th className="text-right font-semibold px-3 py-2">Tokens / img</th>
                <th className="text-right font-semibold px-3 py-2">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {u.recent.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">Nothing yet.</td></tr>
              )}
              {u.recent.map((r, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{when(r.createdAt)}</td>
                  <td className="px-3 py-2 text-gray-700">{r.source || '—'}{r.label ? <span className="text-gray-400"> · {r.label}</span> : null}</td>
                  <td className="px-3 py-2 font-mono text-[12px] text-gray-800">{r.model}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.kind === 'image' ? `${r.images} img${r.size ? ` (${r.size})` : ''}` : fmt(r.tokens)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">{inr(r.costInInr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical / balance */}
      {ledger && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
          <p><span className="font-semibold text-gray-900">Credit balance:</span> {ledger.unlimited ? 'Unlimited' : `${fmt(ledger.dailyBalance)} / ${fmt(ledger.dailyLimit)} today`}</p>
          <p className="mt-1"><span className="font-semibold text-gray-900">Lifetime tokens (all-time):</span> {fmt(ledger.lifetimeTokens)} <span className="text-gray-400">(includes usage from before per-model tracking began)</span></p>
        </div>
      )}
    </div>
  );
}
