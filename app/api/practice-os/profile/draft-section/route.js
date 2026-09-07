import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';
import { structureContent } from '@/lib/practice-os/ai';
import ProfileFieldConfig from '@/models/practice-os/ProfileFieldConfig';
import { mergeProfileSections } from '@/lib/practice-os/profile-fields-defaults';
import Doctor from '@/models/Doctor';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST { sectionId, hint } — AI drafts the fields of ONE profile section from the
// doctor's short input + everything we already know. Returns { values: { key: v } }
// for the doctor to review/edit/approve before moving to the next section.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { sectionId, hint = '' } = await request.json();
    if (!sectionId) return NextResponse.json({ success: false, error: 'Missing section.' }, { status: 400 });

    const configs = await ProfileFieldConfig.find().lean();
    const section = mergeProfileSections(configs).find((s) => s.id === sectionId);
    if (!section) return NextResponse.json({ success: false, error: 'Unknown section.' }, { status: 400 });

    const existing = await getDoctorProfileFields(doctor._id);
    const doc = await Doctor.findById(doctor._id).select('displayName name specialization qualification').lean();

    // Describe each field so the model fills the right keys / respects options.
    const fieldSpec = section.fields.map((f) => {
      const opts = (f.type === 'select' || f.type === 'tags') && f.options?.length ? ` (choose from: ${f.options.join(', ')})` : '';
      return `- ${f.key}: ${f.label}${f.hint ? ` — ${f.hint}` : ''}${opts}`;
    }).join('\n');

    const known = Object.entries(existing)
      .filter(([, v]) => v != null && String(v).trim())
      .slice(0, 40)
      .map(([k, v]) => `${k}: ${String(v).slice(0, 160)}`)
      .join('\n');

    const gen = await structureContent({
      instruction: `You are drafting ONE section ("${section.title}") of an Indian doctor's professional profile. Write a clear, professional, patient-friendly draft for each field below, based on the doctor's input and what we already know. Return ONLY a JSON object keyed by the EXACT field keys. For fields offering a choice list, return one or more of the given options (comma-separated). Omit a field only if you genuinely cannot infer it. Do NOT invent credentials, registration numbers, prices, or specific statistics that were not provided. NMC-compliant — no superlatives or guarantees.\n\nFields to fill:\n${fieldSpec}`,
      source: `Doctor: ${doc?.displayName || doc?.name || ''} (${doc?.specialization || ''}).\nWhat we already know:\n${known || '(little so far)'}\n\nThe doctor's input for this section:\n${hint || '(none — infer from what we already know)'}`,
      profileFields: existing,
    });
    if (!gen.success) return NextResponse.json({ success: false, error: gen.error }, { status: 502 });

    // Keep only keys that belong to this section; coerce to trimmed strings.
    const allowed = new Set(section.fields.map((f) => f.key));
    const values = {};
    for (const [k, v] of Object.entries(gen.data || {})) {
      if (allowed.has(k) && v != null && String(v).trim()) {
        values[k] = Array.isArray(v) ? v.filter(Boolean).join(', ') : String(v).trim();
      }
    }
    return NextResponse.json({ success: true, values });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[profile draft-section]', error);
    return NextResponse.json({ success: false, error: 'Could not draft this section.' }, { status: 500 });
  }
}
