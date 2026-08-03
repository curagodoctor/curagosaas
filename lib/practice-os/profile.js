import Doctor from '@/models/Doctor';
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
  const [doctor, profile] = await Promise.all([
    Doctor.findById(doctorId).select('name displayName specialization').lean(),
    PracticeOsProfile.findOne({ doctorId }).select('credentials').lean(),
  ]);
  const fields = {};
  for (const f of profile?.credentials?.extracted || []) {
    if (f?.value) fields[f.field] = f.value;
  }
  if (!fields.doctor_name) fields.doctor_name = doctor?.displayName || doctor?.name || '';
  if (!fields.specialty && doctor?.specialization) fields.specialty = doctor.specialization;
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
