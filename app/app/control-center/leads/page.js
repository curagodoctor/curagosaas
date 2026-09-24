'use client';

import { useState, useEffect } from 'react';
import PosNav from '@/components/practice-os/PosNav';

// Website enquiries — the "Request a call back" form submissions from the doctor's
// site. Its own tab so every doctor sees their leads (not behind the premium
// Contacts gate).
export default function LeadsPage() {
  const [leads, setLeads] = useState(null);

  useEffect(() => {
    fetch('/api/practice-os/leads', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setLeads(d.success ? (d.leads || []) : []))
      .catch(() => setLeads([]));
  }, []);

  const fmt = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
    } catch { return ''; }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <div className="w-full px-4 sm:px-8 lg:px-12 pt-[64px] pb-12 max-w-[900px] mx-auto">
        <PosNav breadcrumb="Website enquiries" />
        <p className="pos-label" style={{ color: 'var(--green)' }}>Website enquiries</p>
        <h1 className="text-[24px] md:text-[30px] font-semibold text-[var(--ink)] mt-1 mb-1.5" style={{ letterSpacing: '-0.027em' }}>Request-a-call-back submissions</h1>
        <p className="text-[14px] text-[var(--muted)] mb-6" style={{ maxWidth: '60ch' }}>Everyone who filled the &ldquo;Request a call back&rdquo; form on your website appears here — newest first.</p>

        {leads === null ? (
          <div className="pos-card p-6 text-center"><div className="w-7 h-7 mx-auto rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>
        ) : leads.length === 0 ? (
          <div className="pos-card p-8 text-center">
            <p className="text-[15px] font-medium text-[var(--ink)]">No enquiries yet</p>
            <p className="text-[13.5px] text-[var(--muted)] mt-1" style={{ maxWidth: '46ch', margin: '6px auto 0' }}>When a patient submits the &ldquo;Request a call back&rdquo; form on your site, their details show up here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {leads.map((l) => (
              <div key={l.id} className="pos-card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-[var(--ink)]">{l.name || 'Someone'}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[13.5px] text-[var(--muted)]">
                      {l.phone && <a href={`tel:${l.phone}`} style={{ color: 'var(--green)' }}>{l.phone}</a>}
                      {l.email && <a href={`mailto:${l.email}`} style={{ color: 'var(--green)' }}>{l.email}</a>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[12px] text-[var(--muted)]">{fmt(l.createdAt)}</span>
                    {l.phone && <a href={`https://wa.me/${String(l.phone).replace(/\D/g, '').replace(/^0+/, '')}`} target="_blank" rel="noopener noreferrer" className="pos-action" style={{ padding: '7px 12px', fontSize: 13, background: '#25D366' }}>WhatsApp</a>}
                  </div>
                </div>
                {l.message && <p className="text-[13.5px] text-[var(--ink)] mt-2.5 whitespace-pre-wrap" style={{ lineHeight: 1.55 }}>{l.message}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
