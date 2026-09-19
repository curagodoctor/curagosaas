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

// POST — the PAID disease-cluster mapping. Generate 10 diseases FRESH from the
// doctor's specialty (independent of any prior context), each with 1-2 specific
// treatments for that disease. Replaces the doctor's current cluster set. The
// doctor then reviews/edits/approves one disease at a time.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    // Grant-based access (optimization cohort) OR the paid AI tier.
    const allowed = (await hasOptimizationAccess(doctor._id)) || (await hasAiAccess(doctor._id));
    if (!allowed) return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ success: false, error: 'AI is not configured.' }, { status: 500 });
    await assertHasCredits(doctor._id);

    const fields = await getDoctorProfileFields(doctor._id);
    const specialty = fields.specialty || fields.specialization || '';
    if (!specialty) return NextResponse.json({ success: false, error: 'Add your specialty in your profile first.' }, { status: 400 });

    const gen = await structureContent({
      instruction: `You are mapping an Indian doctor's practice for content generation. Use their specialty "${specialty}"${fields.subspecialty ? ` and subspecialty "${fields.subspecialty}"` : ''} as the base, and PREFER the procedures and areas of expertise the doctor actually listed below when choosing treatments. Generate EXACTLY 10 distinct diseases/conditions this doctor treats — ordered most-common first. For EACH disease, list its SPECIFIC treatments (minimum 1, ideally 2 where clinically appropriate, maximum 2) that a doctor of this specialty genuinely performs for THAT disease: use the doctor's OWN listed procedures wherever they apply, and standard, medically-accurate specialty procedures otherwise. Treatments must be disease-specific (never generic, never repeated across diseases unless truly the same), each a real procedure with correct medical terminology paired with a plain patient-facing name. Return JSON: {"diseases": [{"name": string, "treatments": string[] (1-2 items)}]} with exactly 10 diseases. NMC-compliant — factual, no superlatives, no outcome claims.`,
      source: `Specialty: ${specialty}\nSubspecialty: ${fields.subspecialty || '(none)'}\nProcedures the doctor listed: ${fields.procedures || '(none)'}\nAreas of expertise: ${fields.expertise || '(none)'}\nConditions the doctor listed: ${fields.diseases || '(none)'}\nCity: ${fields.city || ''}`,
      profileFields: fields,
    });
    const list = Array.isArray(gen.data?.diseases) ? gen.data.diseases : [];
    if (!list.length) return NextResponse.json({ success: false, error: 'Could not generate diseases — try again.' }, { status: 502 });

    // Replace the doctor's cluster set (fresh mapping — the paid version).
    await PracticeOsDiseaseCluster.deleteMany({ doctorId: doctor._id });
    const docs = list.slice(0, 10).map((d, i) => ({
      doctorId: doctor._id,
      name: String(d.name || '').trim() || `Condition ${i + 1}`,
      slug: slugify(d.name),
      treatments: (Array.isArray(d.treatments) ? d.treatments : []).slice(0, 2)
        .map((t) => ({ name: String(t).trim(), source: 'ai' }))
        .filter((t) => t.name),
      approved: false,
      order: i,
    }));
    await PracticeOsDiseaseCluster.insertMany(docs, { ordered: false }).catch(() => {});
    const clusters = await PracticeOsDiseaseCluster.find({ doctorId: doctor._id }).sort({ order: 1 }).lean();

    const { remaining } = await chargeAiCredits(doctor._id, { label: 'clusters-generate', tokens: gen.usage?.total_tokens || 0 });
    return NextResponse.json({ success: true, clusters, creditsRemaining: remaining });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: "You've used today's AI credits." }, { status: 402 });
    console.error('[clusters generate]', error);
    return NextResponse.json({ success: false, error: 'Could not generate your diseases.' }, { status: 500 });
  }
}
