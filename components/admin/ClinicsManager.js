'use client';

import { useState, useEffect, useCallback } from 'react';
import { useModal } from '@/contexts/ModalContext';

// Phone helper: strip to 10 local digits (drop +91/91/leading 0).
function digits10(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (d.length > 10 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d.slice(-10);
}

// Manage the doctor's clinics and, per clinic, its consultation modes.
// Patients book by: pick clinic → pick one of its modes.
export default function ClinicsManager() {
  const { showAlert, showConfirm } = useModal();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clinicForm, setClinicForm] = useState({ name: '', phone: '', city: '' });
  const [savingClinic, setSavingClinic] = useState(false);
  const [expanded, setExpanded] = useState(null);       // clinicId currently open
  const [modesByClinic, setModesByClinic] = useState({}); // clinicId → modes[]

  const loadClinics = useCallback(async () => {
    try {
      const res = await fetch('/api/doctor/clinics', { credentials: 'include' });
      const d = await res.json();
      if (d.success) setClinics(d.clinics || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadClinics(); }, [loadClinics]);

  const addClinic = async () => {
    if (!clinicForm.name.trim()) return;
    setSavingClinic(true);
    try {
      const res = await fetch('/api/doctor/clinics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({
          name: clinicForm.name.trim(),
          phone: clinicForm.phone ? `+91${digits10(clinicForm.phone)}` : '',
          address: clinicForm.city ? { city: clinicForm.city.trim() } : {},
        }),
      });
      const d = await res.json();
      if (d.success) { setClinics((p) => [...p, d.clinic]); setClinicForm({ name: '', phone: '', city: '' }); }
      else await showAlert({ title: 'Error', message: d.error || 'Failed to add clinic', type: 'error' });
    } finally { setSavingClinic(false); }
  };

  const removeClinic = async (c) => {
    if (!(await showConfirm({ title: 'Remove clinic', message: `Remove "${c.name}" and its consultation modes? Existing bookings keep their saved clinic name.`, type: 'danger' }))) return;
    const res = await fetch(`/api/doctor/clinics/${c._id}`, { method: 'DELETE', credentials: 'include' });
    const d = await res.json();
    if (d.success) setClinics((p) => p.filter((x) => x._id !== c._id));
    else await showAlert({ title: 'Error', message: d.error || 'Failed to remove', type: 'error' });
  };

  const toggle = async (c) => {
    if (expanded === c._id) { setExpanded(null); return; }
    setExpanded(c._id);
    if (!modesByClinic[c._id]) {
      try {
        const res = await fetch(`/api/doctor/modes?clinicId=${c._id}`, { credentials: 'include' });
        const d = await res.json();
        if (d.success) setModesByClinic((m) => ({ ...m, [c._id]: d.modes || [] }));
      } catch { /* ignore */ }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Clinics</h3>
        <p className="text-sm text-gray-600">
          Add each clinic you practise at, then open a clinic to add its consultation modes. Patients pick a clinic, then one of its modes. Clinics also appear when adding a contact and in patient WhatsApp messages.
        </p>
      </div>

      {/* Add clinic */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-gray-900">Add a clinic</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="text" placeholder="Clinic name *" value={clinicForm.name}
            onChange={(e) => setClinicForm((p) => ({ ...p, name: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#096b17] outline-none" />
          <div className="flex items-stretch">
            <span className="inline-flex items-center px-2.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 text-sm">+91</span>
            <input type="tel" inputMode="numeric" maxLength={10} placeholder="Phone" value={clinicForm.phone}
              onChange={(e) => setClinicForm((p) => ({ ...p, phone: digits10(e.target.value) }))}
              className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-r-lg text-sm focus:ring-2 focus:ring-[#096b17] outline-none" />
          </div>
          <input type="text" placeholder="City (optional)" value={clinicForm.city}
            onChange={(e) => setClinicForm((p) => ({ ...p, city: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#096b17] outline-none" />
        </div>
        <button type="button" onClick={addClinic} disabled={savingClinic || !clinicForm.name.trim()}
          className="px-4 py-2 bg-[#096b17] text-white rounded-lg text-sm font-medium hover:bg-[#075110] disabled:opacity-50">
          {savingClinic ? 'Adding…' : 'Add clinic'}
        </button>
      </div>

      {/* Clinic list */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : clinics.length === 0 ? (
        <p className="text-sm text-gray-500">No clinics added yet.</p>
      ) : (
        <div className="space-y-3">
          {clinics.map((c) => (
            <div key={c._id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                <button type="button" onClick={() => toggle(c)} className="flex items-center gap-2 text-left">
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded === c._id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  <span className="font-medium text-gray-900">{c.name}</span>
                  {c.isPrimary && <span className="text-[11px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">Primary</span>}
                  <span className="text-xs text-gray-400">{c.phone || ''}{c.address?.city ? ` · ${c.address.city}` : ''}</span>
                </button>
                <button type="button" onClick={() => removeClinic(c)} className="text-xs text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-md">Remove</button>
              </div>
              {expanded === c._id && (
                <ClinicModes
                  clinicId={c._id}
                  modes={modesByClinic[c._id] || []}
                  setModes={(fn) => setModesByClinic((m) => ({ ...m, [c._id]: fn(m[c._id] || []) }))}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Per-clinic consultation modes: add + remove.
function ClinicModes({ clinicId, modes, setModes }) {
  const { showAlert, showConfirm } = useModal();
  const [form, setForm] = useState({ displayName: '', color: '#3B82F6' });
  const [saving, setSaving] = useState(false);

  const add = async () => {
    const displayName = form.displayName.trim();
    if (!displayName) return;
    setSaving(true);
    try {
      const res = await fetch('/api/doctor/modes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({
          clinicId,
          name: displayName.toLowerCase().replace(/\s+/g, '-'),
          displayName,
          color: form.color,
        }),
      });
      const d = await res.json();
      if (d.success) { setModes((arr) => [...arr, d.mode]); setForm({ displayName: '', color: '#3B82F6' }); }
      else await showAlert({ title: 'Error', message: d.error || 'Failed to add mode', type: 'error' });
    } finally { setSaving(false); }
  };

  const remove = async (m) => {
    if (!(await showConfirm({ title: 'Remove mode', message: `Remove "${m.displayName}"? Its availability/slots are removed too.`, type: 'danger' }))) return;
    const res = await fetch(`/api/doctor/modes?id=${m._id}`, { method: 'DELETE', credentials: 'include' });
    const d = await res.json();
    if (d.success) setModes((arr) => arr.filter((x) => x._id !== m._id));
    else await showAlert({ title: 'Error', message: d.error || 'Failed to remove', type: 'error' });
  };

  return (
    <div className="px-4 py-3 space-y-3">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Consultation modes</p>
      {modes.length === 0 ? (
        <p className="text-sm text-gray-400">No modes yet — add one below (e.g. In-Clinic, Follow-up).</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {modes.map((m) => (
            <span key={m._id} className="inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-full text-sm border" style={{ borderColor: m.color || '#d1d5db' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: m.color || '#3B82F6' }} />
              {m.displayName}
              <button type="button" onClick={() => remove(m)} className="text-gray-400 hover:text-red-600 w-4 h-4 leading-none">×</button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <input type="text" placeholder="Mode name (e.g. In-Clinic)" value={form.displayName}
          onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#096b17] outline-none" />
        <input type="color" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
          className="w-9 h-9 border border-gray-300 rounded-lg cursor-pointer" title="Mode colour" />
        <button type="button" onClick={add} disabled={saving || !form.displayName.trim()}
          className="px-3 py-2 bg-[#096b17] text-white rounded-lg text-sm font-medium hover:bg-[#075110] disabled:opacity-50">Add mode</button>
      </div>
    </div>
  );
}
