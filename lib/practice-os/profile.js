import Doctor from '@/models/Doctor';
import PracticeOsEnrollment from '@/models/practice-os/PracticeOsEnrollment';

/**
 * Practice OS — doctor knowledge base.
 *
 * Builds the profile context injected into the mission assistant so it drafts
 * with the doctor's REAL details (confirmed CV fields + a CV excerpt), never
 * generic filler. Returns '' when there's nothing yet.
 */
const FIELD_LABELS = {
  qualifications: 'Qualifications',
  specialty: 'Specialty',
  registration: 'Registration number',
  procedures: 'Procedures / treatments',
  languages: 'Languages',
};

export async function getDoctorProfileContext(doctorId) {
  const [doctor, enr] = await Promise.all([
    Doctor.findById(doctorId).select('name displayName specialization').lean(),
    PracticeOsEnrollment.findOne({ doctorId }).select('credentials').lean(),
  ]);

  const lines = [];
  const name = doctor?.displayName || doctor?.name;
  if (name) lines.push(`Name: ${name}`);
  if (doctor?.specialization) lines.push(`Specialization: ${doctor.specialization}`);

  // Confirmed extracted CV fields.
  for (const f of enr?.credentials?.extracted || []) {
    if (f?.confirmed && f?.value) lines.push(`${FIELD_LABELS[f.field] || f.field}: ${f.value}`);
  }

  const cvText = enr?.credentials?.cvText || '';
  if (!lines.length && !cvText) return '';

  let ctx = 'This is the doctor you are helping. Use these real details for accurate, personalized drafts. Do not state anything about them beyond what is here.\n';
  if (lines.length) ctx += lines.join('\n');
  if (cvText) ctx += `\n\nCV excerpt:\n${cvText.slice(0, 3000)}`;
  return ctx;
}
