'use client';

// Dedicated "Links" editor (Block 6). A simple label/URL list over the doctor's
// PracticeOsProfile.variables.relevantLinks — the one place links live — so they
// no longer have to go through the profile onboarding to update them.
import { useState, useEffect } from 'react';
import PosNav from '@/components/practice-os/PosNav';

const SUGGESTED = ['Google Maps', 'Google Business Profile', 'Instagram', 'Facebook', 'LinkedIn', 'YouTube', 'Website'];

export default function LinksPage() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/practice-os/links');
        const d = await r.json();
        const existing = Array.isArray(d.links) ? d.links : [];
        setLinks(existing.length ? existing : SUGGESTED.slice(0, 5).map((label) => ({ label, url: '' })));
      } catch { /* leave empty */ }
      setLoading(false);
    })();
  }, []);

  const update = (i, key, val) => {
    setSaved(false);
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, [key]: val } : l)));
  };
  const add = () => { setSaved(false); setLinks((prev) => [...prev, { label: '', url: '' }]); };
  const remove = (i) => { setSaved(false); setLinks((prev) => prev.filter((_, idx) => idx !== i)); };

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      const r = await fetch('/api/practice-os/links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links }),
      });
      const d = await r.json();
      if (d.success) { setLinks(d.links); setSaved(true); }
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: '#F7F9F5', minHeight: '100vh' }}>
      <PosNav />
      <div className="pt-[64px]" />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 80px' }}>
        <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 11, letterSpacing: '0.11em', textTransform: 'uppercase', color: '#5E6B5F', margin: 0 }}>My Profile &amp; Links</p>
        <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.027em', color: '#101A13', margin: '6px 0 4px' }}>Your links</h1>
        <p style={{ fontSize: 16.5, lineHeight: 1.6, color: '#5E6B5F', maxWidth: '52ch', marginBottom: 24 }}>
          The places patients can find you — Google Maps, your Business Profile, Instagram and more.
          These are used across your content and profile.
        </p>

        {loading ? (
          <p style={{ color: '#5E6B5F' }}>Loading…</p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {links.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#FFFFFF', border: '1px solid #DDE4D9', borderRadius: 11, padding: 10 }}>
                  <input
                    value={l.label || ''}
                    onChange={(e) => update(i, 'label', e.target.value)}
                    placeholder="Label"
                    style={{ width: 150, flexShrink: 0, padding: '9px 10px', border: '1px solid #EDF1EB', borderRadius: 8, fontSize: 14.5, outline: 'none' }}
                  />
                  <input
                    value={l.url || ''}
                    onChange={(e) => update(i, 'url', e.target.value)}
                    placeholder="https://…"
                    style={{ flex: 1, minWidth: 0, padding: '9px 10px', border: '1px solid #EDF1EB', borderRadius: 8, fontSize: 14.5, outline: 'none' }}
                  />
                  <button onClick={() => remove(i)} aria-label="Remove link" style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 8, border: '1px solid #EDF1EB', background: '#fff', color: '#5E6B5F', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>

            <button onClick={add} style={{ marginTop: 12, padding: '9px 14px', borderRadius: 8, border: '1px dashed #DDE4D9', background: 'transparent', color: '#5E6B5F', cursor: 'pointer', fontSize: 14.5 }}>
              + Add a link
            </button>

            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                onClick={save}
                disabled={saving}
                style={{ padding: '12px 20px', borderRadius: 9, border: 'none', background: '#F26A1B', color: '#fff', fontSize: 15, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving…' : 'Save links'}
              </button>
              {saved && <span style={{ color: '#096B17', fontSize: 14.5 }}>Saved ✓</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
