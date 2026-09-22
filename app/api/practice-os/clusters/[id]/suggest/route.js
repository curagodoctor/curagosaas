import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess } from '@/lib/practice-os/access';
import { assertHasCredits, chargeAiCredits } from '@/lib/practice-os/aiCredits';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';
import { structureContent } from '@/lib/practice-os/ai';
import PracticeOsDiseaseCluster from '@/models/practice-os/PracticeOsDiseaseCluster';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST — suggest the treatments this doctor offers for one disease, grounded in
// their specialty + stated procedures. Merges AI suggestions into the cluster's
// treatment list (deduped) and returns the updated cluster. Credit-metered.
export async function POST(request, { params }) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    await assertAiAccess(doctor._id);
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ success: false, error: 'AI is not configured.' }, { status: 500 });
    await assertHasCredits(doctor._id);

    const { id } = await params;
    const cluster = await PracticeOsDiseaseCluster.findOne({ _id: id, doctorId: doctor._id });
    if (!cluster) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const fields = await getDoctorProfileFields(doctor._id);
    const gen = await structureContent({
      instruction: `List the SPECIFIC treatments THIS doctor would offer for "${cluster.name}" — minimum 1, maximum 3 — genuinely used for THIS disease (never generic). PREFER the doctor's own listed procedures where they apply; otherwise use standard, medically-accurate procedures for this specialty. Each treatment: a real procedure with full, correct medical terminology (never abbreviations). Return JSON: {"treatments": string[] } (1-3 items). Never invent procedures outside their specialty.`,
      source: `Disease: ${cluster.name}\nSpecialty: ${fields.specialty || ''}\nSubspecialty: ${fields.subspecialty || '(none)'}\nProcedures the doctor listed: ${fields.procedures || '(none)'}\nAreas of expertise: ${fields.expertise || ''}`,
      profileFields: fields,
    });
    const suggested = Array.isArray(gen.data?.treatments) ? gen.data.treatments.map((t) => String(t).trim()).filter(Boolean) : [];
    if (!suggested.length) return NextResponse.json({ success: false, error: 'No suggestions — try adding treatments manually.' }, { status: 502 });

    const body = await request.json().catch(() => ({}));
    if (body.replace) {
      // "Regenerate with AI" — replace this disease's treatments with fresh ones.
      cluster.treatments = suggested.slice(0, 3).map((name) => ({ name, source: 'ai' }));
    } else {
      // Merge (dedupe case-insensitively), keeping existing entries + their
      // source, but never exceed the per-disease maximum of 3.
      const have = new Set(cluster.treatments.map((t) => t.name.toLowerCase()));
      for (const name of suggested) {
        if (cluster.treatments.length >= 3) break;
        if (!have.has(name.toLowerCase())) { cluster.treatments.push({ name, source: 'ai' }); have.add(name.toLowerCase()); }
      }
    }
    await cluster.save();
    const { remaining } = await chargeAiCredits(doctor._id, { label: 'cluster-suggest', tokens: gen.usage?.total_tokens || 0 });
    return NextResponse.json({ success: true, cluster: cluster.toObject(), creditsRemaining: remaining });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: "You've used today's AI credits." }, { status: 402 });
    console.error('[clusters suggest]', error);
    return NextResponse.json({ success: false, error: 'Could not suggest treatments.' }, { status: 500 });
  }
}
