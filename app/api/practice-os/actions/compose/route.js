import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess } from '@/lib/practice-os/access';
import { assertHasCredits, chargeAiCredits } from '@/lib/practice-os/aiCredits';
import { getDoctorProfileContext, getDoctorProfileFields } from '@/lib/practice-os/profile';
import { buildBlueprint, blueprintToPrompt } from '@/lib/practice-os/contentArchitect';
import { runMissionAssistant } from '@/lib/practice-os/ai';
import { stripAssistantPreamble } from '@/lib/practice-os/parseArticle';
import { recordTextUsage } from '@/lib/practice-os/aiUsage';

export const runtime = 'nodejs';
export const maxDuration = 90;

const TYPES = new Set(['blog', 'service', 'gbp', 'product']);

// Per-type drafting brief. Blog/service/product are full pages (double-run);
// gbp is a short Google Business Profile post.
function promptFor(type, idea, specialty) {
  const who = `an Indian ${specialty || 'doctor'}`;
  if (type === 'gbp') return `Write a short Google Business Profile post for ${who} based on this idea: "${idea}". 2–4 sentences, warm and patient-friendly, one helpful takeaway + a gentle call to action to book/visit. No hashtags spam, NMC-compliant (no superlatives or guarantees).`;
  if (type === 'service') return `Write a comprehensive, patient-friendly SERVICE PAGE for ${who} about: "${idea}". Cover what it is, symptoms/when to see a specialist, how it's diagnosed, treatment/procedure options and the doctor's approach, preparation & recovery (general, safe), risks/limitations honestly, FAQs, and how to book. Ground in the doctor's profile. NMC-compliant.`;
  if (type === 'product') return `Write a patient-friendly PAGE describing this offering/package for ${who}: "${idea}". Explain what it includes, who it's for, what to expect, and how to get it. Factual and NMC-compliant — no superlatives or guarantees, no invented prices/claims.`;
  return `Write a comprehensive, patient-friendly blog article for ${who} about: "${idea}". Ground it in the doctor's profile. NMC-compliant.`;
}

export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    await assertAiAccess(doctor._id);
    const { idea, type } = await request.json();
    const kind = TYPES.has(type) ? type : 'blog';
    const topic = String(idea || '').replace(/\{\{.*?\}\}/g, '').trim();
    if (!topic) return NextResponse.json({ success: false, error: 'No idea provided.' }, { status: 400 });
    await assertHasCredits(doctor._id);

    const [profileContext, profileFields] = await Promise.all([getDoctorProfileContext(doctor._id), getDoctorProfileFields(doctor._id)]);
    const isPage = kind !== 'gbp';

    // Double-run (architect → writer) for pages; single short run for GBP posts.
    let blueprintText = '';
    if (isPage) {
      try {
        const bp = await buildBlueprint({ doctorId: doctor._id, topic, specialty: profileFields.specialty, city: profileFields.city || profileFields.location, profileContext });
        blueprintText = blueprintToPrompt(bp);
      } catch { /* best-effort */ }
    }
    const aiPrompt = promptFor(kind, topic, profileFields.specialty);
    const mission = { category: topic, missionText: `${kind} content: ${topic}`, frameworkId: null, aiContext: {} };
    const module = { id: `compose_${kind}`, title: kind, aiPrompt };

    const result = await runMissionAssistant({ mission, module, userPrompt: aiPrompt, profileContext, profileFields, history: [], blueprintText });
    if (!result.success || !result.text) return NextResponse.json({ success: false, error: result.error || 'Could not generate.' }, { status: 502 });
    const content = stripAssistantPreamble(result.text);
    try { await recordTextUsage(doctor._id, { model: result.model, promptTokens: result.usage?.promptTokens, completionTokens: result.usage?.completionTokens, totalTokens: result.usage?.totalTokens, source: `compose-${kind}` }); } catch { /* best-effort */ }
    const { remaining } = await chargeAiCredits(doctor._id, { label: `compose-${kind}` });

    return NextResponse.json({ success: true, content, type: kind, creditsRemaining: remaining });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: "You've used all of today's AI credits. They reset tomorrow." }, { status: 402 });
    console.error('[compose]', error);
    return NextResponse.json({ success: false, error: 'Could not generate the content.' }, { status: 500 });
  }
}
