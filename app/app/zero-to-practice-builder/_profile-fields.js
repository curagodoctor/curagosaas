'use client';

// Shared doctor-profile field renderer, used by both Day-0 setup and the editable
// "My Profile" page. The field DEFINITIONS live in a server-safe module so the
// admin merge API can share them; the effective list may be customised by admin.
import { useState } from 'react';
import { DEFAULT_SECTIONS } from '@/lib/practice-os/profile-fields-defaults';

// Editable chip list — the practice-map pattern. The value stays a comma-joined
// string (the source-of-truth format), rendered as removable tags with a "+ Add"
// entry. Used for expertise / diseases / procedures.
function ChipsField({ value, onChange, placeholder, options, listId }) {
  const [draft, setDraft] = useState('');
  const items = (value || '').split(',').map((x) => x.trim()).filter(Boolean);
  // Only suggest options not already chosen.
  const suggestions = Array.isArray(options)
    ? options.filter((o) => !items.some((x) => x.toLowerCase() === String(o).toLowerCase()))
    : null;
  const commit = (str) => onChange(str.join(', '));
  const add = () => {
    // Allow pasting several comma-separated items at once.
    const parts = draft.split(',').map((x) => x.trim()).filter(Boolean);
    if (!parts.length) { setDraft(''); return; }
    const merged = [...items];
    for (const p of parts) if (!merged.some((x) => x.toLowerCase() === p.toLowerCase())) merged.push(p);
    commit(merged);
    setDraft('');
  };
  const removeAt = (i) => commit(items.filter((_, j) => j !== i));
  return (
    <div className="flex flex-wrap items-center gap-2 mt-1.5 p-2 rounded-[11px]" style={{ border: '1px solid var(--rule)', background: 'var(--paper)' }}>
      {items.map((label, i) => (
        <span key={`${label}-${i}`} className="inline-flex items-center gap-2 rounded-[9px] px-2.5 py-1.5 text-[13.5px]"
          style={{ background: 'var(--green-soft)', border: '1px solid var(--green)', color: 'var(--green)' }}>
          {label}
          <button type="button" onClick={() => removeAt(i)} aria-label={`Remove ${label}`}
            className="leading-none cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
            style={{ background: 'transparent', border: 0, color: 'inherit', fontSize: 15 }}>×</button>
        </span>
      ))}
      <input value={draft} onChange={(e) => setDraft(e.target.value)}
        list={suggestions ? listId : undefined}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } else if (e.key === 'Backspace' && !draft && items.length) { removeAt(items.length - 1); } }}
        onBlur={add} placeholder={placeholder || 'Type and press Enter'}
        autoComplete="off"
        className="flex-1 min-w-[140px] text-[14px] outline-none bg-transparent px-1.5 py-1" />
      {suggestions && <datalist id={listId}>{suggestions.map((o) => <option key={o} value={o} />)}</datalist>}
    </div>
  );
}

// Default (built-in) sections. Pages fetch the admin-merged list at runtime and
// fall back to these if the fetch fails, so onboarding never breaks.
export const SECTIONS = DEFAULT_SECTIONS;

export const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);
export const REQUIRED_FIELDS = ALL_FIELDS.filter((f) => f.required).map((f) => f.key);

// Flatten any sections shape (default or admin-merged) into helper arrays.
export function fieldsOf(sections) { return sections.flatMap((s) => s.fields); }
export function requiredOf(sections) { return fieldsOf(sections).filter((f) => f.required).map((f) => f.key); }

// A single profile field — renders input / textarea / number / select / tag chips.
export function Field({ f, value, confidence, error, onChange, onToggleTag }) {
  const selectedTags = (value || '').split(',').map((x) => x.trim()).filter(Boolean);
  return (
    <div>
      <label className="pos-label">
        {f.label}{f.required && <span style={{ color: 'var(--orange)' }}> *</span>}
      </label>
      {f.hint && <p className="text-[11.5px] text-[var(--muted)] mt-0.5 leading-snug">{f.hint}</p>}

      {f.chips ? (
        <ChipsField value={value} onChange={onChange} placeholder={f.chipPlaceholder} options={f.options} listId={`chips-${f.key}`} />
      ) : f.type === 'select' ? (
        <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full pos-card p-2.5 text-sm mt-1" style={error ? { borderColor: '#dc2626' } : undefined}>
          {f.options.map((o) => <option key={o} value={o}>{o || 'Select…'}</option>)}
        </select>
      ) : f.type === 'tags' ? (
        <div className="flex flex-wrap gap-2 mt-1">
          {f.options.map((o) => {
            const on = selectedTags.includes(o);
            return (
              <button key={o} type="button" onClick={() => onToggleTag(o)}
                className="text-[13px] rounded-full px-3 py-1.5 border transition-colors"
                style={{ borderColor: on ? 'var(--green)' : 'var(--rule)', background: on ? 'var(--green-soft)' : 'transparent', color: 'var(--ink)' }}>
                {o}
              </button>
            );
          })}
        </div>
      ) : f.multiline ? (
        <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={f.big ? 4 : 2} className="w-full pos-card p-2.5 text-sm mt-1" style={error ? { borderColor: '#dc2626' } : undefined} />
      ) : (
        <input type={f.type === 'number' ? 'number' : 'text'} value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full pos-card p-2.5 text-sm mt-1" style={error ? { borderColor: '#dc2626' } : undefined} />
      )}

      {error && <p className="text-[11px] text-red-600 mt-1">Required</p>}
      {!error && confidence != null && value && (
        <p className="text-[10px] mt-1" style={{ color: confidence >= 0.6 ? 'var(--green)' : 'var(--orange)' }}>
          {confidence >= 0.6 ? 'From your CV' : 'From your CV — please double-check'}
        </p>
      )}
    </div>
  );
}
