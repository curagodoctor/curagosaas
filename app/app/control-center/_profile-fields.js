'use client';

// Shared doctor-profile field renderer, used by both Day-0 setup and the editable
// "My Profile" page. The field DEFINITIONS live in a server-safe module so the
// admin merge API can share them; the effective list may be customised by admin.
import { useState, useRef, useEffect } from 'react';
import { DEFAULT_SECTIONS } from '@/lib/practice-os/profile-fields-defaults';

// A dropdown-combobox: shows the option list beneath the field (filtered as you
// type), and still allows a custom entry. Used for the specialty field so the
// same behaviour appears in onboarding AND the My Profile page.
function ComboBox({ value, onChange, placeholder, options, error }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);
  const q = String(value || '').toLowerCase().trim();
  const filtered = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input value={value || ''} placeholder={placeholder || 'Pick one or type your own'} autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="w-full pos-card p-2.5 text-sm mt-1" style={error ? { borderColor: '#dc2626' } : undefined} />
      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, maxHeight: 240, overflowY: 'auto', background: 'var(--card, #fff)', border: '1px solid var(--rule)', borderRadius: 10, boxShadow: '0 8px 24px rgba(16,26,19,.12)' }}>
          {filtered.map((o) => (
            <button key={o} type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(o); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--paper)]"
              style={{ color: 'var(--ink)', background: o === value ? 'var(--green-soft, rgba(9,107,23,.08))' : 'transparent', borderBottom: '1px solid var(--rule-soft)' }}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

      {f.combo ? (
        <ComboBox value={value} onChange={onChange} placeholder={f.placeholder} options={f.options || []} error={error} />
      ) : f.chips ? (
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
      ) : f.money ? (
        // Consultation fee — ₹ prefixed, digits only.
        <div className="flex items-stretch mt-1 rounded-lg overflow-hidden" style={{ border: `1px solid ${error ? '#dc2626' : 'var(--rule)'}`, background: 'var(--card, #fff)' }}>
          <span className="grid place-items-center px-3 text-sm" style={{ background: 'var(--paper)', borderRight: '1px solid var(--rule)', color: 'var(--muted)' }}>₹</span>
          <input inputMode="numeric" value={value || ''} onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 7))} placeholder="500" className="flex-1 p-2.5 text-sm outline-none bg-transparent" />
        </div>
      ) : f.digits ? (
        // Digit-only field with a fixed length (phone, PIN).
        <input inputMode="numeric" value={value || ''} maxLength={f.digits}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, f.digits))}
          className="w-full pos-card p-2.5 text-sm mt-1" style={error ? { borderColor: '#dc2626' } : undefined} />
      ) : (
        <input type={f.type === 'number' ? 'number' : 'text'} value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full pos-card p-2.5 text-sm mt-1" style={error ? { borderColor: '#dc2626' } : undefined} />
      )}

      {/* Length hint for digit fields when partially filled. */}
      {f.digits && value && String(value).length !== f.digits && !error && (
        <p className="text-[11px] text-[var(--orange)] mt-1">Enter {f.digits} digits ({String(value).length}/{f.digits}).</p>
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
