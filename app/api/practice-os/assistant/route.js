import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess } from '@/lib/practice-os/access';
import { assertHasCredits, chargeAiCredits, getRemainingCredits } from '@/lib/practice-os/aiCredits';
import { runAssistant, isAiConfigured } from '@/lib/practice-os/ai';
import { getDoctorProfileContext, getDoctorProfileFields, isProfileReadyForAi } from '@/lib/practice-os/profile';
import { proposeSiteEdits, applySiteChanges } from '@/lib/practice-os/siteEdits';
import PracticeOsChatMessage from '@/models/practice-os/PracticeOsChatMessage';

export const runtime = 'nodejs';
export const maxDuration = 60;

// The global assistant thread — one persistent conversation per doctor, separate
// from any mission thread (missionId stays null, sessionId = 'global').
const GLOBAL_SESSION = 'global';

// GET — the persistent conversation + credit state, so the widget restores on any page.
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const [history, remaining] = await Promise.all([
      PracticeOsChatMessage.find({ doctorId: doctor._id, missionId: null, sessionId: GLOBAL_SESSION })
        .sort({ createdAt: 1 }).limit(100).lean(),
      getRemainingCredits(doctor._id),
    ]);
    return NextResponse.json({
      success: true,
      configured: isAiConfigured(),
      creditsRemaining: remaining,
      messages: history.map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt })),
    });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

// POST { prompt } — one assistant turn (1 credit). Persisted to the global thread.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    await assertAiAccess(doctor._id);

    const { prompt } = await request.json();
    if (!prompt || !prompt.trim()) return NextResponse.json({ success: false, error: 'Please enter a message.' }, { status: 400 });
    await assertHasCredits(doctor._id);

    const [profileContext, profileFields, prior] = await Promise.all([
      getDoctorProfileContext(doctor._id),
      getDoctorProfileFields(doctor._id),
      PracticeOsChatMessage.find({ doctorId: doctor._id, missionId: null, sessionId: GLOBAL_SESSION }).sort({ createdAt: 1 }).limit(20).lean(),
    ]);
    const history = prior.map((m) => ({ role: m.role, content: m.content }));

    // Guard: a fresh/thin profile would produce generic, unrelated output. Send
    // them to finish their profile first — no credit charged.
    if (!isProfileReadyForAi(profileFields)) {
      return NextResponse.json({
        success: true,
        needsProfile: true,
        reply: "Before I can write anything useful for you, I need to know your practice. Head to **Profile** and add your specialty, the conditions you treat and the procedures you perform — then ask me again and everything I draft will be grounded in your real practice, not generic.",
        creditsRemaining: await getRemainingCredits(doctor._id),
      });
    }

    // Unified assistant — if the doctor asks to CREATE a page/blog, hand off to
    // the blog engine (the client calls draft-blog with this topic). Editing the
    // website is routed to the AI builder.
    if (/\b(write|create|draft|generate|make|prepare)\b[^?]*\b(blog|article|page|post|educational)\b/i.test(prompt)) {
      return NextResponse.json({ success: true, reply: 'On it — drafting that page now. It will open for you to review and publish.', action: { type: 'write_page', topic: prompt }, creditsRemaining: await getRemainingCredits(doctor._id) });
    }
    if (/\b(edit|change|update|redesign|rewrite|add)\b[^?]*\b(website|homepage|home page|site|section|about|services|faq)\b/i.test(prompt)) {
      const BookingPage = (await import('@/models/BookingPage')).default;
      const page = await BookingPage.findOne({ doctorId: doctor._id, slug: 'home' });
      if (!page) {
        return NextResponse.json({ success: true, reply: "You don't have a website yet — build one first from the AI builder.", action: { type: 'edit_website', link: '/admin/dashboard/ai-generate' }, creditsRemaining: await getRemainingCredits(doctor._id) });
      }
      const proposed = await proposeSiteEdits({ sections: page.sections || [], message: prompt, profileFields, history });
      if (proposed.ok && (proposed.edits.length || proposed.adds.length)) {
        page.draftSections = applySiteChanges(page.sections || [], proposed.edits, proposed.adds);
        page.draftMeta = { source: 'ai-assistant', createdAt: new Date() };
        page.markModified('draftSections');
        await page.save();
        const { remaining } = await chargeAiCredits(doctor._id, { label: 'assistant-site-edit', tokens: proposed.usage?.total_tokens || 0 });
        const changed = [...proposed.edits.map((e) => e.type), ...proposed.adds.map((a) => `new ${a.type}`)].join(', ');
        return NextResponse.json({ success: true, reply: `${proposed.reply || 'Done.'} Saved as a draft (${changed}). [Review & publish →](/admin/dashboard/ai-generate)`, creditsRemaining: remaining });
      }
      return NextResponse.json({ success: true, reply: proposed.reply || "Tell me the specific change and I'll apply it — e.g. 'make the About section warmer' or 'add an FAQ about appointment timings'.", creditsRemaining: await getRemainingCredits(doctor._id) });
    }

    const result = await runAssistant({ userPrompt: prompt, profileContext, profileFields, history });
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 502 });

    const usage = result.usage || {};
    const { remaining } = await chargeAiCredits(doctor._id, { label: 'assistant', tokens: usage.totalTokens || 0 });

    await PracticeOsChatMessage.create([
      { doctorId: doctor._id, missionId: null, sessionId: GLOBAL_SESSION, role: 'user', content: prompt },
      { doctorId: doctor._id, missionId: null, sessionId: GLOBAL_SESSION, role: 'assistant', content: result.text, totalTokens: usage.totalTokens || 0 },
    ]);

    return NextResponse.json({ success: true, reply: result.text, creditsRemaining: remaining });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired', message: 'You need AI credits to chat.' }, { status: 402 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: "You've used all of today's AI credits." }, { status: 402 });
    console.error('[assistant POST]', error);
    return NextResponse.json({ success: false, error: 'The assistant is unavailable right now.' }, { status: 500 });
  }
}
