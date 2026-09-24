import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, hasOptimizationAccess, hasAiAccess } from '@/lib/practice-os/access';
import { assertHasCredits, chargeAiCredits } from '@/lib/practice-os/aiCredits';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';
import { structureContent } from '@/lib/practice-os/ai';
import PracticeOsDiseaseCluster from '@/models/practice-os/PracticeOsDiseaseCluster';

export const runtime = 'nodejs';
export const maxDuration = 60;

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// POST — the NON-SURGICAL path: derive up to 20 standalone treatments/procedures
// from the doctor's specialty alone (no disease grouping). Each becomes its own
// entry (kind:'treatment', name = the treatment, with itself as its one treatment),
// so downstream content/tokens/GBP services treat each as its own page.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const allowed = (await hasOptimizationAccess(doctor._id)) || (await hasAiAccess(doctor._id));
    if (!allowed) return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ success: false, error: 'AI is not configured.' }, { status: 500 });
    await assertHasCredits(doctor._id);

    const fields = await getDoctorProfileFields(doctor._id);
    const specialty = fields.specialty || fields.specialization || '';
    if (!specialty) return NextResponse.json({ success: false, error: 'Add your specialty in your profile first.' }, { status: 400 });

    const gen = await structureContent({
      instruction: `From the specialty "${specialty}"${fields.subspecialty ? ` (subspecialty "${fields.subspecialty}")` : ''}, generate the core TREATMENT / PROCEDURE universe for an INDEPENDENT NON-SURGICAL specialist practising in an Indian Tier-1 or Tier-2 city. This is architecture only — clinically coherent, commercially meaningful, SEO-useful — NOT a keyword list.

Generate up to 20 distinct treatments/procedures/services this specialist genuinely offers — weighted toward COMMON + HIGH-DEMAND + HIGH-PRACTICE-VALUE, with a smaller set of complex/high-authority ones. Prioritise the highest patient-demand, highest-value services first. Each must be: medically distinct; clinically legitimate; genuinely within this specialty and an independent specialist's actual scope; consistent with current medical standards. PREFER the doctor's own listed procedures/expertise where they apply. Use full, standard medical terminology paired with a plain patient-facing name where helpful — NEVER abbreviations. Do NOT create separate entries for wording variations. Do NOT list procedures the specialist would not personally perform.

Return JSON: {"treatments": [{"name": string, "tier": "common"|"authority", "reason": string (one line)}]} with up to 20 treatments in priority order. NMC-compliant — factual, no superlatives, no outcome/success claims.`,
      source: `Specialty: ${specialty}\nSubspecialty: ${fields.subspecialty || '(none)'}\nProcedures the doctor listed: ${fields.procedures || '(none)'}\nAreas of expertise: ${fields.expertise || '(none)'}\nConditions the doctor listed: ${fields.diseases || '(none)'}\nCity: ${fields.city || ''}`,
      profileFields: fields,
    });
    const list = Array.isArray(gen.data?.treatments) ? gen.data.treatments : [];
    if (!list.length) return NextResponse.json({ success: false, error: 'Could not generate treatments — try again.' }, { status: 502 });

    // Replace the doctor's map with the fresh treatment set.
    await PracticeOsDiseaseCluster.deleteMany({ doctorId: doctor._id });
    const seen = new Set();
    const docs = [];
    for (const t of list.slice(0, 20)) {
      const name = String(t.name || '').trim();
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      docs.push({
        doctorId: doctor._id,
        kind: 'treatment',
        name,
        slug: slugify(name),
        tier: t.tier === 'authority' ? 'authority' : 'common',
        reason: String(t.reason || '').trim().slice(0, 200),
        treatments: [{ name, source: 'ai' }],
        approved: false,
        order: docs.length,
      });
    }
    await PracticeOsDiseaseCluster.insertMany(docs, { ordered: false }).catch(() => {});
    // The map changed → clear cached day-interface drafts for not-yet-completed
    // missions so each day regenerates from this fresh treatment set.
    try {
      const PracticeOsChatMessage = (await import('@/models/practice-os/PracticeOsChatMessage')).default;
      const UserMissionProgress = (await import('@/models/practice-os/UserMissionProgress')).default;
      const doneIds = (await UserMissionProgress.find({ doctorId: doctor._id, status: 'completed' }).select('missionId').lean()).map((p) => p.missionId);
      await PracticeOsChatMessage.deleteMany({ doctorId: doctor._id, missionId: { $nin: doneIds } });
    } catch { /* best-effort */ }
    const clusters = await PracticeOsDiseaseCluster.find({ doctorId: doctor._id }).sort({ order: 1 }).lean();

    const { remaining } = await chargeAiCredits(doctor._id, { label: 'clusters-generate-treatments', tokens: gen.usage?.total_tokens || 0 });
    return NextResponse.json({ success: true, clusters, creditsRemaining: remaining });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: "You've used today's AI credits." }, { status: 402 });
    console.error('[clusters generate-treatments]', error);
    return NextResponse.json({ success: false, error: 'Could not generate your treatments.' }, { status: 500 });
  }
}
