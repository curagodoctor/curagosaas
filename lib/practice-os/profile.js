import Doctor from '@/models/Doctor';
import Clinic from '@/models/Clinic';
import PracticeOsProfile from '@/models/practice-os/PracticeOsProfile';

/**
 * The doctor-global Practice OS profile (CV knowledge base + intent). Created on
 * first access. Setup is entered once and shared across every pack the doctor owns.
 */
export async function getOrCreateProfile(doctorId) {
  let p = await PracticeOsProfile.findOne({ doctorId });
  if (!p) p = await PracticeOsProfile.create({ doctorId });
  return p;
}

/**
 * Practice OS — doctor knowledge base.
 *
 * Builds the profile context injected into the mission assistant so it drafts
 * with the doctor's REAL details (confirmed CV fields + a CV excerpt), never
 * generic filler. Returns '' when there's nothing yet.
 */
const FIELD_LABELS = {
  doctor_name: 'Name',
  designation: 'Designation',
  specialty: 'Specialty',
  subspecialty: 'Subspecialty',
  qualifications: 'Qualifications',
  additional_qualifications: 'Fellowships / additional qualifications',
  years_experience: 'Years of experience',
  expertise: 'Areas of expertise',
  diseases: 'Common diseases treated',
  procedures: 'Procedures / treatments',
  usp: 'Unique strength',
  interests: 'Areas of interest',
  languages: 'Languages',
  awards: 'Awards',
  publications: 'Publications',
  registration: 'Registration number',
  age: 'Age',
  gender: 'Gender',
  clinic_name: 'Clinic name',
  clinic_address: 'Clinic address',
  city: 'City',
  state: 'State',
  pin_code: 'PIN code',
  consultation_timings: 'Consultation timings',
  consultation_fee: 'Consultation fee',
  appointment_number: 'Appointment number',
  whatsapp_number: 'WhatsApp number',
  writing_style: 'Preferred writing style',
  doctor_personality: 'Personality (how patients should describe them)',
  custom_instructions: 'Custom instructions for the assistant',
};

/**
 * Generate a short professional summary of the doctor from their profile, for
 * display in the UI. Factual, third-person, NMC-compliant. Returns '' if no
 * profile yet or AI unconfigured.
 */
export async function generateDoctorSummary(doctorId) {
  if (!process.env.OPENAI_API_KEY) return '';
  const ctx = await getDoctorProfileContext(doctorId);
  if (!ctx) return '';
  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      max_tokens: 300,
      messages: [
        { role: 'system', content: 'Write a warm, factual 2–3 sentence professional summary of this doctor, in third person, for their own CuraGo dashboard. Use ONLY the facts provided — never invent. Keep it NMC-compliant: no superlatives, no comparative or guaranteed-outcome claims.' },
        { role: 'user', content: ctx },
      ],
    });
    return (completion.choices?.[0]?.message?.content || '').trim();
  } catch (e) {
    console.error('[Practice OS summary]', e.message);
    return '';
  }
}

/**
 * The doctor's profile as a flat { field: value } map — used to fill the
 * {{placeholder}} tokens in the (visible) per-mission prompt, server-side.
 */
export async function getDoctorProfileFields(doctorId) {
  const [doctor, profile, primaryClinic] = await Promise.all([
    Doctor.findById(doctorId).select('name displayName specialization clinicName whatsappNumber phone').lean(),
    PracticeOsProfile.findOne({ doctorId }).select('credentials variables').lean(),
    Clinic.findOne({ doctorId }).sort({ isPrimary: -1, sortOrder: 1, createdAt: 1 }).select('name phone').lean(),
  ]);
  const fields = {};
  for (const f of profile?.credentials?.extracted || []) {
    if (f?.value) fields[f.field] = f.value;
  }
  // Variables collected from module inputs (gbp_link, website_url, …) — these
  // win over CV fields since they're the doctor's own confirmed, live values.
  for (const [k, v] of Object.entries(profile?.variables || {})) {
    if (v != null && String(v).trim()) fields[k] = String(v).trim();
  }
  if (!fields.doctor_name) fields.doctor_name = doctor?.displayName || doctor?.name || '';
  if (!fields.specialty && doctor?.specialization) fields.specialty = doctor.specialization;

  // Unify clinic/contact tokens with the booking data (Clinic Manager + Settings)
  // so {{clinic_name}}, {{whatsapp_number}} and {{appointment_number}} always
  // match what patients actually see. The canonical booking value wins; the
  // Practice Builder profile value is the fallback.
  const canonicalClinicName = (doctor?.clinicName && doctor.clinicName.trim()) || primaryClinic?.name || '';
  if (canonicalClinicName) fields.clinic_name = canonicalClinicName;
  const canonicalWhatsapp = doctor?.whatsappNumber || '';
  if (canonicalWhatsapp) fields.whatsapp_number = canonicalWhatsapp;
  if (!fields.appointment_number) fields.appointment_number = primaryClinic?.phone || doctor?.whatsappNumber || doctor?.phone || '';

  // Forgive common token-name variants so a button authored as
  // {{google_drive_link}} still resolves to the doctor's {{drive_link}} value,
  // {{google_business_profile}} → {{gbp_link}}, etc. Only fills a variant when
  // the canonical value exists and the variant isn't already set.
  const ALIASES = {
    drive_link: ['google_drive', 'google_drive_link', 'drive', 'google_drive_url', 'drivelink'],
    gbp_link: ['gbp', 'google_business', 'google_business_profile', 'google_business_profile_link', 'gbp_url', 'gmb_link'],
    whatsapp_number: ['whatsapp', 'whatsapp_no', 'wa_number'],
    appointment_number: ['appointment_no', 'booking_number', 'contact_number'],
    clinic_name: ['clinic'],
  };
  for (const [canonical, alts] of Object.entries(ALIASES)) {
    if (fields[canonical] != null && String(fields[canonical]).trim()) {
      for (const a of alts) if (!(fields[a] != null && String(fields[a]).trim())) fields[a] = fields[canonical];
    }
  }

  return fields;
}

export async function getDoctorProfileContext(doctorId) {
  const [doctor, profile] = await Promise.all([
    Doctor.findById(doctorId).select('name displayName specialization').lean(),
    PracticeOsProfile.findOne({ doctorId }).select('credentials').lean(),
  ]);

  const lines = [];
  const name = doctor?.displayName || doctor?.name;
  if (name) lines.push(`Name: ${name}`);
  if (doctor?.specialization) lines.push(`Specialization: ${doctor.specialization}`);

  // Confirmed extracted CV fields.
  for (const f of profile?.credentials?.extracted || []) {
    if (f?.confirmed && f?.value) lines.push(`${FIELD_LABELS[f.field] || f.field}: ${f.value}`);
  }

  const cvText = profile?.credentials?.cvText || '';
  if (!lines.length && !cvText) return '';

  let ctx = 'This is the doctor you are helping. Use these real details for accurate, personalized drafts. Do not state anything about them beyond what is here.\n';
  if (lines.length) ctx += lines.join('\n');
  if (cvText) ctx += `\n\nCV excerpt:\n${cvText.slice(0, 3000)}`;
  return ctx;
}
