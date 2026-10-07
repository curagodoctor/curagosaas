'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';

const fmt = (n) => (n || 0).toLocaleString('en-IN');
const inr = (n) => `₹${(Math.round((n || 0) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const BAR_COLORS = ['#096b17', '#F26A1B', '#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];

export default function AiUsagePage() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/platform/ai-usage?days=${days}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.usage); })
      .finally(() => setLoading(false));
  }, [days]);

  if (loading && !data) return <div className="py-16 text-center text-gray-500">Loading AI usage…</div>;
  if (!data) return <div className="py-16 text-center text-red-600">Could not load AI usage.</div>;

  const Card = ({ label, value, sub }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Usage</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI consumption and cost across all doctors — tokens, images, requests and spend by model.</p>
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card label="Total cost (all-time)" value={inr(data.totals.costInInr)} sub={`${fmt(data.totals.requests)} requests`} />
        <Card label="Today" value={inr(data.today.costInInr)} sub={`${fmt(data.today.requests)} requests`} />
        <Card label="Last 7 days" value={inr(data.last7d.costInInr)} sub={`${fmt(data.last7d.requests)} requests`} />
        <Card label="Last 30 days" value={inr(data.last30d.costInInr)} sub={`${fmt(data.totals.totalTokens)} tokens · ${fmt(data.totals.images)} images`} />
      </div>

      {/* Daily cost graph */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Daily cost (last {data.days} days)</h3>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={data.daily} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#096b17" stopOpacity={0.3} /><stop offset="100%" stopColor="#096b17" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} minTickGap={20} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} width={48} />
              <Tooltip formatter={(v, n) => (n === 'costInInr' ? [inr(v), 'Cost'] : [fmt(v), 'Requests'])} labelClassName="text-xs" />
              <Area type="monotone" dataKey="costInInr" stroke="#096b17" strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two charts: by model + top users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Cost by model</h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={data.byModel.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <YAxis type="category" dataKey="model" tick={{ fontSize: 10 }} width={110} />
                <Tooltip formatter={(v) => [inr(v), 'Cost']} />
                <Bar dataKey="costInInr" radius={[0, 4, 4, 0]}>
                  {data.byModel.slice(0, 8).map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Top doctors by spend</h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={data.byUser.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                <Tooltip formatter={(v) => [inr(v), 'Cost']} />
                <Bar dataKey="costInInr" radius={[0, 4, 4, 0]} fill="#F26A1B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Per-user table */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Usage by doctor</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-3 py-2">Doctor</th>
                <th className="text-right font-semibold px-3 py-2">Requests</th>
                <th className="text-right font-semibold px-3 py-2">Tokens</th>
                <th className="text-right font-semibold px-3 py-2">Images</th>
                <th className="text-right font-semibold px-3 py-2">Cost</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.byUser.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No AI usage recorded yet.</td></tr>}
              {data.byUser.map((u) => (
                <tr key={u.doctorId}>
                  <td className="px-3 py-2"><span className="font-medium text-gray-900">{u.name}</span>{u.email ? <span className="text-gray-400 text-xs block">{u.email}</span> : null}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(u.requests)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(u.totalTokens)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(u.images)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{inr(u.costInInr)}</td>
                  <td className="px-3 py-2 text-right"><Link href={`/platform-admin/dashboard/doctors/${u.doctorId}`} className="text-[#096b17] text-xs font-medium hover:underline">Details →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Breakdown by source + raw logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">By touch point (source)</h3>
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wide"><tr><th className="text-left font-semibold px-3 py-2">Source</th><th className="text-right font-semibold px-3 py-2">Requests</th><th className="text-right font-semibold px-3 py-2">Cost</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {data.bySource.map((s, i) => (
                  <tr key={i}><td className="px-3 py-2 font-mono text-[12px] text-gray-800">{s.source}</td><td className="px-3 py-2 text-right tabular-nums">{fmt(s.requests)}</td><td className="px-3 py-2 text-right tabular-nums font-medium">{inr(s.costInInr)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">By model</h3>
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wide"><tr><th className="text-left font-semibold px-3 py-2">Model</th><th className="text-left font-semibold px-3 py-2">Type</th><th className="text-right font-semibold px-3 py-2">Requests</th><th className="text-right font-semibold px-3 py-2">Cost</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {data.byModel.map((m, i) => (
                  <tr key={i}><td className="px-3 py-2 font-mono text-[12px] text-gray-800">{m.model}</td><td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${m.kind === 'image' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{m.kind}</span></td><td className="px-3 py-2 text-right tabular-nums">{fmt(m.requests)}</td><td className="px-3 py-2 text-right tabular-nums font-medium">{inr(m.costInInr)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Raw logs */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Recent AI requests (log)</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-3 py-2">When</th>
                <th className="text-left font-semibold px-3 py-2">Doctor</th>
                <th className="text-left font-semibold px-3 py-2">Source</th>
                <th className="text-left font-semibold px-3 py-2">Model</th>
                <th className="text-right font-semibold px-3 py-2">Tokens / img</th>
                <th className="text-right font-semibold px-3 py-2">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recent.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">Nothing yet.</td></tr>}
              {data.recent.map((r, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{when(r.createdAt)}</td>
                  <td className="px-3 py-2 text-gray-800">{r.doctor}</td>
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

      <p className="text-[11px] text-gray-400">Costs are estimates from OpenAI list prices (USD→INR at ₹{data.usdToInr}/$). Tracking records every AI call going forward across onboarding, website/blog generation, GBP, the assistant and the daily engine.</p>
    </div>
  );
}
