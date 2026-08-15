'use client';

// Shared doctor-profile field definitions + field renderer, used by both Day-0
// setup and the editable "My Profile" page. The professional section is the part
// a CV can pre-fill; practice & voice are manual. `required` marks mandatory fields.
export const SECTIONS = [
  {
    id: 'pro',
    title: 'Professional profile',
    note: 'Pre-filled from your CV where we could read it — confirm each. We never invent a credential.',
    fields: [
      { key: 'doctor_name', label: 'Full name', required: true },
      { key: 'designation', label: 'Current designation', required: true },
      { key: 'specialty', label: 'Specialty', required: true },
      { key: 'subspecialty', label: 'Subspecialty' },
      { key: 'qualifications', label: 'Primary qualifications', multiline: true, required: true },
      { key: 'additional_qualifications', label: 'Fellowships / additional qualifications', multiline: true },
      { key: 'years_experience', label: 'Years of experience', type: 'number', required: true },
      { key: 'expertise', label: 'Areas of expertise', multiline: true, required: true },
      { key: 'diseases', label: 'Common diseases treated', multiline: true, required: true },
      { key: 'procedures', label: 'Common procedures', multiline: true },
      { key: 'usp', label: 'Unique strength (USP)', multiline: true },
      { key: 'interests', label: 'Areas of interest', multiline: true },
      { key: 'languages', label: 'Languages spoken', required: true },
      { key: 'awards', label: 'Awards', multiline: true },
      { key: 'publications', label: 'Publications', multiline: true },
      { key: 'registration', label: 'Registration number' },
      { key: 'age', label: 'Age', type: 'number' },
      { key: 'gender', label: 'Gender', type: 'select', options: ['', 'Male', 'Female', 'Prefer not to say'], required: true },
    ],
  },
  {
    id: 'practice',
    title: 'Practice information',
    note: 'Where and how patients reach you — used for your Google profile, website and reception script.',
    fields: [
      { key: 'clinic_name', label: 'Clinic name' },
      { key: 'clinic_address', label: 'Clinic address', multiline: true, required: true },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'pin_code', label: 'PIN code' },
      { key: 'consultation_timings', label: 'Consultation timings', multiline: true, required: true },
      { key: 'consultation_fee', label: 'Consultation fee' },
      { key: 'appointment_number', label: 'Appointment number', required: true },
      { key: 'whatsapp_number', label: 'WhatsApp number' },
    ],
  },
  {
    id: 'voice',
    title: 'Voice & personality',
    note: 'This shapes how your AI assistant writes across every page and post.',
    fields: [
      { key: 'writing_style', label: 'Writing style', type: 'select', options: ['', 'Formal', 'Conversational', 'Friendly', 'Academic', 'Premium'] },
      { key: 'doctor_personality', label: 'How should patients describe you?', type: 'tags', options: ['Calm and approachable', 'Highly knowledgeable', 'Honest and straightforward', 'Friendly and empathetic', 'Evidence-based', 'Reassuring', 'Minimalist and practical'] },
      { key: 'custom_instructions', label: 'Anything else for your AI assistant', multiline: true, big: true },
    ],
  },
];

export const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);
export const REQUIRED_FIELDS = ALL_FIELDS.filter((f) => f.required).map((f) => f.key);

// A single profile field — renders input / textarea / number / select / tag chips.
export function Field({ f, value, confidence, error, onChange, onToggleTag }) {
  const selectedTags = (value || '').split(',').map((x) => x.trim()).filter(Boolean);
  return (
    <div>
      <label className="pos-label">
        {f.label}{f.required && <span style={{ color: 'var(--orange)' }}> *</span>}
      </label>

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
