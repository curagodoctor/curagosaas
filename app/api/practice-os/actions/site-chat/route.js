import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess } from '@/lib/practice-os/access';
import { assertHasCredits, chargeAiCredits } from '@/lib/practice-os/aiCredits';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';
import { proposeSiteEdits } from '@/lib/practice-os/siteEdits';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST { message, sections, history } — the website-builder chatbot. Given the
// current page sections (sent from the editor, incl. unsaved edits) and a
// natural-language request, the AI PROPOSES an edit to a single section. It does
// NOT save — the editor applies the proposed config to its local state and the
// doctor reviews it in the live preview before saving. Gated on an active pack.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    await assertAiAccess(doctor._id);

    const { message, sections = [], history = [] } = await request.json();
    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Empty message.' }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ success: false, error: 'AI is not configured.' }, { status: 500 });
    }
    await assertHasCredits(doctor._id);

    const fields = await getDoctorProfileFields(doctor._id);

    // Shared engine — same brain the unified assistant uses.
    const proposed = await proposeSiteEdits({ sections, message, profileFields: fields, history });
    if (!proposed.ok) return NextResponse.json({ success: false, error: proposed.error || 'Could not understand that — try rephrasing.' }, { status: 502 });
    const { edits, adds } = proposed;

    // Charge one credit per assistant turn (whether or not it proposed edits).
    const { remaining } = await chargeAiCredits(doctor._id, { label: 'site-chat', tokens: proposed.usage?.total_tokens || 0 });

    // `edit` kept for backward compatibility with older clients.
    return NextResponse.json({ success: true, reply: proposed.reply, edits, adds, edit: edits[0] || null, creditsRemaining: remaining });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: "You've used all of today's AI credits. They reset tomorrow." }, { status: 402 });
    console.error('[site-chat]', error);
    return NextResponse.json({ success: false, error: 'The assistant is unavailable right now.' }, { status: 500 });
  }
}
