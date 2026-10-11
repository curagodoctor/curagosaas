'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// Weekly "what are patients searching for" — the SerpAPI feature. Shows the AI
// digest, topics worth writing about, and the raw queries grouped by source.

const KIND_META = {
  question: { label: 'Questions patients ask', accent: 'var(--orange)' },
  autocomplete: { label: 'Autocomplete suggestions', accent: 'var(--green)' },
  related: { label: 'Related searches', accent: 'var(--green)' },
  rising: { label: 'Rising on Google Trends', accent: 'var(--orange)' },
  top: { label: 'Top on Google Trends', accent: 'var(--green)' },
};
const KIND_ORDER = ['question', 'autocomplete', 'related', 'rising', 'top'];

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; }
}
function weekRange(weekStart) {
  if (!weekStart) return '';
  const s = new Date(weekStart);
  const e = new Date(s); e.setUTCDate(e.getUTCDate() + 6);
  const f = (x) => x.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${f(s)} – ${f(e)}`;
}

export default function SearchTrendsPage() {
  const [state, setState] = useState({ loading: true });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch('/api/practice-os/search-trends', { credentials: 'include' });
      const d = await res.json();
      setState({ loading: false, ...d });
    } catch {
      setState({ loading: false, success: false, error: 'Could not load search trends.' });
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const { loading, status, report } = state;
  const grouped = {};
  for (const q of report?.queries || []) (grouped[q.kind] ||= []).push(q.query);
  const totalQueries = report?.queries?.length || 0;

  return (
    <div className="pos-root" style={{ background: 'var(--paper)', minHeight: '100%' }}>
      <div className="mx-auto max-w-[920px] px-5 md:px-8 py-8 md:py-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <div className="text-[10.5px] font-mono uppercase tracking-[0.11em]" style={{ color: 'var(--muted)' }}>
              Research Agent
            </div>
            <h1 className="text-[26px] md:text-[32px] font-semibold leading-tight mt-1" style={{ color: 'var(--ink)', letterSpacing: '-0.025em' }}>
              What your patients are searching for
            </h1>
            {report && (
              <p className="text-[14px] mt-2" style={{ color: 'var(--muted)' }}>
                {report.specialty}{report.city ? ` · ${report.city}` : ''}
                {report.weekStart ? <> · week of {weekRange(report.weekStart)}</> : null}
              </p>
            )}
          </div>
          {report && totalQueries > 0 && (
            <div className="text-right shrink-0">
              <div style={{ fontFamily: 'var(--serif), Georgia, serif', fontSize: 44, lineHeight: 1, color: 'var(--green)', letterSpacing: '-0.03em' }}>
                {totalQueries}
              </div>
              <div className="text-[10.5px] font-mono uppercase tracking-[0.11em] mt-1" style={{ color: 'var(--muted)' }}>
                live searches
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="rounded-xl p-8 text-center text-[14px]" style={{ background: 'var(--card)', border: '1px solid var(--rule-soft)', color: 'var(--muted)' }}>
            Gathering this week's searches…
          </div>
        )}

        {/* No specialty yet → send them to finish the profile */}
        {!loading && status === 'not-ready' && !report && (
          <div className="rounded-xl p-7" style={{ background: 'var(--card)', border: '1px solid var(--rule-soft)' }}>
            <p className="text-[15px] mb-1" style={{ color: 'var(--ink)' }}>We need your specialty and city first.</p>
            <p className="text-[14px] mb-4" style={{ color: 'var(--muted)' }}>
              Search trends are built from what patients look for in your field and your city — add those in your profile and they'll appear here.
            </p>
            <Link href="/app/control-center/profile" className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13.5px] font-semibold text-white" style={{ background: 'var(--orange)' }}>
              Complete my profile
            </Link>
          </div>
        )}

        {/* Feature not yet switched on (no key) and nothing cached */}
        {!loading && status === 'not-configured' && !report && (
          <div className="rounded-xl p-7" style={{ background: 'var(--card)', border: '1px solid var(--rule-soft)' }}>
            <p className="text-[15px] mb-1" style={{ color: 'var(--ink)' }}>Search trends are being switched on.</p>
            <p className="text-[14px]" style={{ color: 'var(--muted)' }}>Your weekly patient-search digest will appear here shortly.</p>
          </div>
        )}

        {report && (
          <div className="flex flex-col gap-5">
            {/* AI digest */}
            {report.summary && (
              <section className="rounded-xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--rule-soft)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }} />
                  <h2 className="text-[11px] font-mono uppercase tracking-[0.11em]" style={{ color: 'var(--muted)' }}>This week, in short</h2>
                </div>
                <p className="text-[15.5px] leading-[1.65]" style={{ color: 'var(--ink)' }}>{report.summary}</p>
              </section>
            )}

            {/* Suggested topics */}
            {report.suggestedTopics?.length > 0 && (
              <section className="rounded-xl p-6" style={{ background: 'var(--orange-soft, rgba(242,106,27,.06))', border: '1px solid rgba(242,106,27,.2)' }}>
                <h2 className="text-[11px] font-mono uppercase tracking-[0.11em] mb-3" style={{ color: 'var(--orange)' }}>Worth writing about</h2>
                <ul className="flex flex-col gap-2">
                  {report.suggestedTopics.map((t, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[14.5px]" style={{ color: 'var(--ink)' }}>
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--orange)' }} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Raw queries, grouped by source */}
            {totalQueries > 0 && (
              <section className="rounded-xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--rule-soft)' }}>
                <h2 className="text-[11px] font-mono uppercase tracking-[0.11em] mb-4" style={{ color: 'var(--muted)' }}>The searches</h2>
                <div className="flex flex-col gap-5">
                  {KIND_ORDER.filter((k) => grouped[k]?.length).map((k) => (
                    <div key={k}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: KIND_META[k].accent }} />
                        <h3 className="text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>{KIND_META[k].label}</h3>
                        <span className="text-[11px]" style={{ color: 'var(--muted)' }}>({grouped[k].length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {grouped[k].map((q, i) => (
                          <span key={i} className="inline-block rounded-full px-3 py-1.5 text-[13px]" style={{ background: 'var(--rule-soft)', color: 'var(--ink)' }}>{q}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
              Updated weekly from live Google search data · last refreshed {fmtDate(report.fetchedAt)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
