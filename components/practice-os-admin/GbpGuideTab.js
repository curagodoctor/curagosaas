'use client';

import { useState, useEffect, useCallback } from 'react';

// §8b — admin editor for the GBP setup guide (blocks + tasks + field-type tags)
// shown to doctors during onboarding. Saved to PracticeOsSettings.gbpGuide.
const KINDS = ['DO NOT TOUCH', 'ONE-TIME', 'EDITABLE', 'LEARN'];

export default function GbpGuideTab() {
  const [blocks, setBlocks] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    try {
      const d = await fetch('/api/platform/practice-os/settings').then((r) => r.json());
      if (d.success) setBlocks((d.settings?.gbpGuide || []).map((b) => ({ ...b, tasks: (b.tasks || []).map((t) => ({ ...t })) })));
      else setBlocks([]);
    } catch { setBlocks([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const upBlock = (i, field, v) => setBlocks((bs) => bs.map((b, j) => (j === i ? { ...b, [field]: v } : b)));
  const upTask = (bi, ti, field, v) => setBlocks((bs) => bs.map((b, j) => (j === bi ? { ...b, tasks: b.tasks.map((t, k) => (k === ti ? { ...t, [field]: v } : t)) } : b)));
  const addBlock = () => setBlocks((bs) => [...bs, { key: '', label: 'New block', title: '', desc: '', mandatory: false, tasks: [] }]);
  const rmBlock = (i) => setBlocks((bs) => bs.filter((_, j) => j !== i));
  const addTask = (bi) => setBlocks((bs) => bs.map((b, j) => (j === bi ? { ...b, tasks: [...b.tasks, { label: '', hint: '', kind: 'EDITABLE' }] } : b)));
  const rmTask = (bi, ti) => setBlocks((bs) => bs.map((b, j) => (j === bi ? { ...b, tasks: b.tasks.filter((_, k) => k !== ti) } : b)));

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const d = await fetch('/api/platform/practice-os/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gbpGuide: blocks }),
      }).then((r) => r.json());
      if (d.success) { setBlocks((d.settings?.gbpGuide || []).map((b) => ({ ...b, tasks: (b.tasks || []).map((t) => ({ ...t })) }))); setMsg({ type: 'ok', text: 'Saved.' }); }
      else setMsg({ type: 'err', text: d.error || 'Could not save.' });
    } catch { setMsg({ type: 'err', text: 'Something went wrong.' }); } finally { setSaving(false); }
  };

  if (blocks === null) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">GBP setup guide</h2>
          <p className="text-sm text-gray-500 mt-0.5">The blocks, tasks and field-type tags doctors see during onboarding. Tags: DO NOT TOUCH, ONE-TIME, EDITABLE, LEARN.</p>
        </div>
        <button onClick={addBlock} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium whitespace-nowrap">+ Add block</button>
      </div>

      {msg && <div className={`rounded-lg px-4 py-2.5 text-sm mb-4 ${msg.type === 'ok' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg.text}</div>}

      <div className="space-y-5">
        {blocks.map((b, bi) => (
          <div key={bi} className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Block {bi + 1}</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-sm text-gray-600"><input type="checkbox" checked={!!b.mandatory} onChange={(e) => upBlock(bi, 'mandatory', e.target.checked)} /> Mandatory</label>
                <button onClick={() => rmBlock(bi)} className="text-red-500 hover:text-red-700 text-sm">Remove block</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <input value={b.label} onChange={(e) => upBlock(bi, 'label', e.target.value)} placeholder="Tab label (e.g. Suspension risk)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input value={b.title} onChange={(e) => upBlock(bi, 'title', e.target.value)} placeholder="Heading" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <input value={b.desc} onChange={(e) => upBlock(bi, 'desc', e.target.value)} placeholder="Description" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />

            <div className="space-y-2">
              {b.tasks.map((t, ti) => (
                <div key={ti} className="flex flex-wrap gap-2 items-center">
                  <input value={t.label} onChange={(e) => upTask(bi, ti, 'label', e.target.value)} placeholder="Task" className="flex-1 min-w-[160px] border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  <input value={t.hint} onChange={(e) => upTask(bi, ti, 'hint', e.target.value)} placeholder="Hint" className="flex-1 min-w-[160px] border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  <select value={t.kind} onChange={(e) => upTask(bi, ti, 'kind', e.target.value)} className="border border-gray-200 rounded-lg px-2 py-2 text-sm">
                    {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                  <button onClick={() => rmTask(bi, ti)} className="text-red-500 hover:text-red-700 text-sm px-1">✕</button>
                </div>
              ))}
            </div>
            <button onClick={() => addTask(bi)} className="text-sm text-blue-600 hover:underline mt-2">+ Add task</button>
          </div>
        ))}
      </div>

      <button onClick={save} disabled={saving} className="mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Saving…' : 'Save guide'}</button>
    </div>
  );
}
