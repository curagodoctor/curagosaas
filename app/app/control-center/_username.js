'use client';

import { useState, useEffect } from 'react';

// Pick / update the anonymous leaderboard name (unique, validated server-side).
export function UsernamePicker({ onSaved }) {
  const [current, setCurrent] = useState('');
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch('/api/practice-os/username').then((r) => r.json()).then((d) => {
      if (d.success) { setCurrent(d.username || ''); setInput(d.username || ''); }
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch('/api/practice-os/username', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: input }),
      });
      const d = await res.json();
      if (d.success) { setCurrent(d.username); setMsg({ ok: true, text: 'Saved — you\'re on the leaderboard.' }); onSaved?.(d.username); }
      else setMsg({ ok: false, text: d.error || 'Could not save.' });
    } catch {
      setMsg({ ok: false, text: 'Could not save.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pick an anonymous name"
          maxLength={20}
          className="pos-card p-2.5 text-sm flex-1"
        />
        <button onClick={save} disabled={saving || !input.trim() || input === current} className="pos-action pos-focusable disabled:opacity-50">
          {saving ? 'Saving…' : (current ? 'Update' : 'Join')}
        </button>
      </div>
      {msg && <p className="text-[12px] mt-1.5" style={{ color: msg.ok ? 'var(--green)' : '#dc2626' }}>{msg.text}</p>}
      <p className="text-[11px] text-[var(--muted)] mt-1.5">3–20 letters, numbers or underscore. Shown on the leaderboard instead of your real name.</p>
    </div>
  );
}

// Shown after a mission — invites the doctor to join the leaderboard, but only
// if they haven't picked a name yet. Hides itself once joined.
export function LeaderboardPrompt() {
  const [loaded, setLoaded] = useState(false);
  const [has, setHas] = useState(false);

  useEffect(() => {
    fetch('/api/practice-os/username').then((r) => r.json()).then((d) => {
      setHas(!!(d.success && d.username));
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  if (!loaded || has) return null;
  return (
    <div className="pos-card p-5 mb-6" style={{ background: 'var(--green-soft)', borderColor: 'var(--green)' }}>
      <p className="pos-label mb-1" style={{ color: 'var(--green)' }}>Join the leaderboard</p>
      <p className="text-sm text-[var(--ink)] mb-3">Compete anonymously with the cohort on XP, streak and speed — pick a name.</p>
      <UsernamePicker onSaved={() => setHas(true)} />
    </div>
  );
}
