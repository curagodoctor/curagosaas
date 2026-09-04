import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess } from '@/lib/practice-os/access';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';
import { structureContent } from '@/lib/practice-os/ai';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST — before generating the website, the AI inspects the doctor's profile and
// asks a few clarifying questions (with dynamic input types + asset uploads) to
// fill gaps, so the generated site is accurate and rich. Returns a question list
// the /questions page renders dynamically. Not credit-charged (generation is).
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    await assertAiAccess(doctor._id);

    const fields = await getDoctorProfileFields(doctor._id);
    const profileSummary = Object.entries(fields)
      .filter(([, v]) => v != null && String(v).trim())
      .slice(0, 40)
      .map(([k, v]) => `${k}: ${String(v).slice(0, 160)}`)
      .join('\n');

    const gen = await structureContent({
      instruction: `You are setting up an Indian doctor's clinic website. Based on what we already know (below), ask a SHORT set of questions to fill the gaps needed for a great, accurate website. Rules:
- Ask only what's missing or would materially improve the site. 3 to 6 content questions max. Do NOT ask for things already known.
- Prefer "select" or "multiselect" with sensible ready options so the doctor can just tap; use "text"/"textarea" only when free input is needed.
- ALWAYS include exactly two asset questions at the end: {"id":"logo","type":"image","label":"Upload your clinic logo (optional)"} and {"id":"hero_image","type":"image","label":"Upload a photo of you or your clinic (optional)"}.
Return ONLY JSON: {"questions":[{"id":string (snake_case, unique),"label":string,"help":string (optional short),"type":"text"|"textarea"|"select"|"multiselect"|"image","options":[string] (for select/multiselect),"placeholder":string (optional)}]}.`,
      source: `What we already know about the doctor:\n${profileSummary || '(almost nothing — ask the essentials: specialty, key services/procedures, years of experience, languages, clinic city/area, unique strengths)'}`,
      profileFields: fields,
    });
    if (!gen.success) return NextResponse.json({ success: false, error: gen.error }, { status: 502 });

    const raw = Array.isArray(gen.data?.questions) ? gen.data.questions : [];
    const questions = raw
      .filter((q) => q && q.id && q.label)
      .slice(0, 10)
      .map((q) => ({
        id: String(q.id).slice(0, 60),
        label: String(q.label).slice(0, 200),
        help: String(q.help || '').slice(0, 200),
        type: ['text', 'textarea', 'select', 'multiselect', 'image'].includes(q.type) ? q.type : 'text',
        options: Array.isArray(q.options) ? q.options.map((o) => String(o).slice(0, 80)).filter(Boolean).slice(0, 12) : [],
        placeholder: String(q.placeholder || '').slice(0, 120),
      }));

    return NextResponse.json({ success: true, questions });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    console.error('[site-intake]', error);
    return NextResponse.json({ success: false, error: 'Could not prepare questions.' }, { status: 500 });
  }
}
