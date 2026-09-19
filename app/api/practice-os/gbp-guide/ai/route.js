import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess } from '@/lib/practice-os/access';
import { assertHasCredits, chargeAiCredits } from '@/lib/practice-os/aiCredits';
import { getDoctorProfileContext, getDoctorProfileFields } from '@/lib/practice-os/profile';
import { runAssistant } from '@/lib/practice-os/ai';
import { DEFAULT_GBP_GUIDE } from '@/lib/practice-os/gbpGuide';
import PracticeOsSettings from '@/models/practice-os/PracticeOsSettings';
import PracticeOsProfile from '@/models/practice-os/PracticeOsProfile';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST { blockKey, message? } — run a GBP block's admin-set AI prompt (grounded
// in the doctor's profile) when the block loads, or continue refining it via a
// chat message. Caches the latest response per block on the profile. Credit-metered.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    await assertAiAccess(doctor._id);
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ success: false, error: 'AI is not configured.' }, { status: 500 });
    await assertHasCredits(doctor._id);

    const { blockKey, message } = await request.json();
    const settings = await PracticeOsSettings.getSettings();
    const blocks = Array.isArray(settings.gbpGuide) && settings.gbpGuide.length ? settings.gbpGuide : DEFAULT_GBP_GUIDE;
    const block = blocks.find((b) => b.key === blockKey);
    if (!block) return NextResponse.json({ success: false, error: 'Block not found.' }, { status: 404 });
    if (!block.aiPrompt && !message) return NextResponse.json({ success: false, error: 'This block has no AI prompt.' }, { status: 400 });

    const [profileContext, profileFields, profile] = await Promise.all([
      getDoctorProfileContext(doctor._id),
      getDoctorProfileFields(doctor._id),
      PracticeOsProfile.findOne({ doctorId: doctor._id }),
    ]);

    const prior = profile?.gbpAiResponses?.[blockKey] || '';
    // A chat message refines the existing answer; otherwise run the block prompt.
    const userPrompt = message && message.trim()
      ? `Here is the current draft:\n\n${prior}\n\nThe doctor asks: ${message.trim()}\n\nReturn the updated version.`
      : `${block.aiPrompt}\n\nThis is for the "${block.title || block.label}" step of setting up the doctor's Google Business Profile.`;

    const result = await runAssistant({ userPrompt, profileContext, profileFields, history: [] });
    if (!result.success || !result.text) return NextResponse.json({ success: false, error: result.error || 'Could not generate.' }, { status: 502 });

    // Cache the latest response for this block.
    if (profile) {
      profile.gbpAiResponses = { ...(profile.gbpAiResponses || {}), [blockKey]: result.text };
      profile.markModified('gbpAiResponses');
      await profile.save();
    }

    const { remaining } = await chargeAiCredits(doctor._id, { label: `gbp-ai:${blockKey}`, tokens: result.usage?.totalTokens || 0 });
    return NextResponse.json({ success: true, reply: result.text, creditsRemaining: remaining });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: "You've used today's AI credits." }, { status: 402 });
    console.error('[gbp-guide ai]', error);
    return NextResponse.json({ success: false, error: 'The assistant is unavailable right now.' }, { status: 500 });
  }
}
