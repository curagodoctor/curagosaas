'use client';

// Shared doctor-profile field renderer, used by both Day-0 setup and the editable
// "My Profile" page. The field DEFINITIONS live in a server-safe module so the
// admin merge API can share them; the effective list may be customised by admin.
import { DEFAULT_SECTIONS } from '@/lib/practice-os/profile-fields-defaults';

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

      {f.type === 'select' ? (
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
