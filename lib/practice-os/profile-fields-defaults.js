// Server-safe default profile-field definitions (no JSX / client code), so both
// the doctor UI and the admin merge API can import them. The client renderer and
// the admin-managed overrides build on top of these. See [[practiceos-rename]].

export const DEFAULT_SECTIONS = [
  {
    id: 'pro',
    title: 'Professional profile',
    note: 'Pre-filled from your CV where we could read it — confirm each. We never invent a credential.',
    fields: [
      { key: 'doctor_name', label: 'Full name', required: true, hint: 'As it should appear on your website and Google — e.g. Dr. Anaya Mehta.' },
      { key: 'designation', label: 'Current designation', required: true, hint: 'Your current role or title — e.g. Consultant Dermatologist.' },
      { key: 'specialty', label: 'Specialty', required: true, hint: 'Your main field — e.g. Dermatology.' },
      { key: 'subspecialty', label: 'Subspecialty', hint: 'A narrower focus, if any — e.g. Paediatric dermatology.' },
      { key: 'qualifications', label: 'Primary qualifications', multiline: true, required: true, hint: 'Your core degrees — e.g. MBBS, MD (Dermatology).' },
      { key: 'additional_qualifications', label: 'Fellowships / additional qualifications', multiline: true, hint: 'Fellowships or extra training. Leave blank if none.' },
      { key: 'years_experience', label: 'Years of experience', type: 'number', required: true, hint: 'Total years practising.' },
      { key: 'expertise', label: 'Areas of expertise', multiline: true, required: true, hint: 'What you\'re known for treating well.' },
      { key: 'diseases', label: 'Common diseases treated', multiline: true, required: true, hint: 'Conditions you treat most often — separate with commas.' },
      { key: 'procedures', label: 'Common procedures', multiline: true, hint: 'Treatments or procedures you perform — separate with commas.' },
      { key: 'usp', label: 'Unique strength (USP)', multiline: true, hint: 'What makes your practice different, in a line or two.' },
      { key: 'interests', label: 'Areas of interest', multiline: true, hint: 'Clinical interests you\'d like to be known for.' },
      { key: 'languages', label: 'Languages spoken', required: true, hint: 'Languages you consult in — e.g. English, Hindi, Tamil.' },
      { key: 'awards', label: 'Awards', multiline: true, hint: 'Recognitions or honours. Leave blank if none.' },
      { key: 'publications', label: 'Publications', multiline: true, hint: 'Papers or articles. Leave blank if none.' },
      { key: 'registration', label: 'Registration number', hint: 'Your state/national medical council registration number.' },
      { key: 'age', label: 'Age', type: 'number', hint: 'Optional.' },
      { key: 'gender', label: 'Gender', type: 'select', options: ['', 'Male', 'Female', 'Prefer not to say'], required: true, hint: 'Used only so we write about you correctly (he/she/they).' },
    ],
  },
  {
    id: 'practice',
    title: 'Practice information',
    note: 'Where and how patients reach you — used for your Google profile, website and reception script.',
    fields: [
      { key: 'clinic_name', label: 'Clinic name', hint: 'The name patients see — e.g. Skin & Glow Clinic.' },
      { key: 'clinic_address', label: 'Clinic address', multiline: true, required: true, hint: 'Full address exactly as it should show on Google and your site.' },
      { key: 'city', label: 'City', hint: 'The city patients search in — used for local SEO.' },
      { key: 'state', label: 'State' },
      { key: 'pin_code', label: 'PIN code' },
      { key: 'consultation_timings', label: 'Consultation timings', multiline: true, required: true, hint: 'Your OPD hours — e.g. Mon–Sat, 10am–1pm & 5–8pm.' },
      { key: 'consultation_fee', label: 'Consultation fee', hint: 'Shown on your site only if you want. Leave blank to hide.' },
      { key: 'appointment_number', label: 'Appointment number', required: true, hint: 'The number patients call to book.' },
      { key: 'whatsapp_number', label: 'WhatsApp number', hint: 'Used for WhatsApp booking confirmations and reminders.' },
    ],
  },
  {
    id: 'voice',
    title: 'Voice & personality',
    note: 'This shapes how your AI assistant writes across every page and post.',
    fields: [
      { key: 'writing_style', label: 'Writing style', type: 'select', options: ['', 'Formal', 'Conversational', 'Friendly', 'Academic', 'Premium'], hint: 'The tone your AI uses across all your content.' },
      { key: 'doctor_personality', label: 'How should patients describe you?', type: 'tags', options: ['Calm and approachable', 'Highly knowledgeable', 'Honest and straightforward', 'Friendly and empathetic', 'Evidence-based', 'Reassuring', 'Minimalist and practical'], hint: 'Pick a few — this shapes how you come across in writing.' },
      { key: 'custom_instructions', label: 'Anything else for your AI assistant', multiline: true, big: true, hint: 'Anything the assistant should always keep in mind when writing for you.' },
    ],
  },
];

export const SECTION_IDS = DEFAULT_SECTIONS.map((s) => s.id);

// Merge admin-managed field configs onto the defaults:
//  - a config matching a default field KEY overrides its label/hint/required, or
//    hides it (hidden:true);
//  - a config with a NEW key is appended to its section as a custom field;
//  - `order` (when set) sorts fields within a section.
// Returns the same { id, title, note, fields[] } shape the UI already renders.
export function mergeProfileSections(configs = []) {
  const byKey = new Map(configs.map((c) => [c.key, c]));
  const usedKeys = new Set();

  const sections = DEFAULT_SECTIONS.map((sec) => {
    const fields = [];
    for (const f of sec.fields) {
      const cfg = byKey.get(f.key);
      if (cfg) {
        usedKeys.add(f.key);
        if (cfg.hidden) continue;                 // admin hid this default field
        fields.push({
          ...f,
          label: cfg.label || f.label,
          hint: cfg.hint != null ? cfg.hint : f.hint,
          required: cfg.required != null ? cfg.required : f.required,
          _order: cfg.order,
        });
      } else {
        fields.push(f);
      }
    }
    return { ...sec, fields };
  });

  // Append custom (new-key) fields to their section.
  for (const c of configs) {
    if (usedKeys.has(c.key) || c.hidden) continue;
    const sec = sections.find((s) => s.id === (c.section || 'pro')) || sections[0];
    sec.fields.push({
      key: c.key,
      label: c.label || c.key,
      hint: c.hint || '',
      required: !!c.required,
      type: c.type && c.type !== 'text' ? c.type : undefined,
      multiline: c.type === 'textarea',
      options: Array.isArray(c.options) ? c.options : undefined,
      _order: c.order,
      custom: true,
    });
  }

  // Apply per-field ordering where provided (stable otherwise).
  for (const sec of sections) {
    sec.fields = sec.fields
      .map((f, i) => ({ f, i }))
      .sort((a, b) => {
        const ao = a.f._order != null ? a.f._order : a.i;
        const bo = b.f._order != null ? b.f._order : b.i;
        return ao - bo || a.i - b.i;
      })
      .map(({ f }) => { const { _order, ...rest } = f; return rest; });
  }
  return sections;
}
