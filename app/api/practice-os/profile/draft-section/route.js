import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';
import { structureContent } from '@/lib/practice-os/ai';
import { PROFILE_RULES } from '@/lib/practice-os/contentRules';
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
    const { sectionId, hint = '', specialty: specialtyIn = '', only = null } = await request.json();
    if (!sectionId) return NextResponse.json({ success: false, error: 'Missing section.' }, { status: 400 });

    const configs = await ProfileFieldConfig.find().lean();
    const section = mergeProfileSections(configs).find((s) => s.id === sectionId);
    if (!section) return NextResponse.json({ success: false, error: 'Unknown section.' }, { status: 400 });

    const existing = await getDoctorProfileFields(doctor._id);
    const doc = await Doctor.findById(doctor._id).select('displayName name specialization qualification').lean();
    // Authoritative specialty: the just-changed value the client sends wins, then
    // the saved profile, then the Doctor record. This is what the lists key off.
    const specialty = String(specialtyIn || existing.specialty || doc?.specialization || '').trim();

    // `only` restricts generation to a subset of the section's fields — a focused,
    // reliable draft (e.g. just USP + interests), instead of relying on the big
    // list-heavy draft to also fill short prose fields (which it often skips).
    const onlyKeys = Array.isArray(only) && only.length ? new Set(only) : null;
    const targetFields = onlyKeys ? section.fields.filter((f) => onlyKeys.has(f.key)) : section.fields;

    // Describe each field so the model fills the right keys / respects options.
    const fieldSpec = targetFields.map((f) => {
      const opts = (f.type === 'select' || f.type === 'tags') && f.options?.length ? ` (choose from: ${f.options.join(', ')})` : '';
      return `- ${f.key}: ${f.label}${f.hint ? ` — ${f.hint}` : ''}${opts}`;
    }).join('\n');

    // EXCLUDE the fields this section will (re)generate from "what we already
    // know" — otherwise the model just echoes the existing values, so regenerating
    // after a specialty change returns the OLD diseases/treatments unchanged.
    const sectionKeys = new Set(section.fields.map((f) => f.key));
    const known = Object.entries(existing)
      .filter(([k, v]) => v != null && String(v).trim() && !sectionKeys.has(k))
      .slice(0, 40)
      .map(([k, v]) => `${k}: ${String(v).slice(0, 160)}`)
      .join('\n');

    const gen = await structureContent({
      instruction: `You are drafting ONE section ("${section.title}") of an Indian doctor's professional profile. Write a clear, professional, patient-friendly draft for each field below, based STRICTLY on the doctor's specialty and input. Return ONLY a JSON object keyed by the EXACT field keys. For fields offering a choice list, return one or more of the given options (comma-separated).\n\nGenerate every list field FRESH for the specialty given below — do not carry over unrelated items. BE COMPREHENSIVE AND THOROUGH — this is the doctor's practice map. For the list fields, generate a RICH, COMPLETE, comma-separated list that genuinely reflects the full scope of THIS specialty, ordered from most common to least. Minimum counts (generate AT LEAST this many, more where the specialty supports it): areas of expertise — at least 6 items; diseases/conditions treated — 12–20 items; procedures/treatments — 12–20 items. Do not stop below the minimum. Every item must be genuinely relevant to this specialty (never padding). You MUST fill EVERY field listed below — including short prose fields like "usp" (a 1–2 line unique strength) and "interests" (a comma-separated list of clinical interests). Never return an empty or missing field unless it genuinely cannot be inferred from the specialty. Do NOT invent credentials, registration numbers, prices, or specific statistics that were not provided. NMC-compliant — no superlatives or guarantees.\n\nFields to fill:\n${fieldSpec}`,
      source: `Doctor: ${doc?.displayName || doc?.name || ''}.\nSpecialty (authoritative — generate strictly for THIS specialty): ${specialty || '(unknown)'}\nWhat we already know:\n${known || '(little so far)'}\n\nThe doctor's input for this section:\n${hint || '(none — infer from the specialty above)'}`,
      profileFields: existing,
      extraRules: PROFILE_RULES,
    });
    if (!gen.success) return NextResponse.json({ success: false, error: gen.error }, { status: 502 });

    // Keep only keys we asked for; coerce to trimmed strings.
    const allowed = new Set(targetFields.map((f) => f.key));
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
