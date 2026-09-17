import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess } from '@/lib/practice-os/access';
import { assertHasCredits, chargeAiCredits } from '@/lib/practice-os/aiCredits';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';
import { structureContent } from '@/lib/practice-os/ai';
import PracticeOsDocument from '@/models/practice-os/PracticeOsDocument';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST /api/practice-os/documents/[id]/draft-script — take a Content Planner
// idea and refine it into a ready-to-record short-form script (reel / short /
// post). Grounded in the doctor's profile, NMC-compliant, credit-metered. Saves
// the script onto the document and advances its status to 'script'.
export async function POST(request, { params }) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    await assertAiAccess(doctor._id);
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ success: false, error: 'AI is not configured.' }, { status: 500 });
    await assertHasCredits(doctor._id);

    const { id } = await params;
    const doc = await PracticeOsDocument.findOne({ _id: id, doctorId: doctor._id, kind: 'reel' });
    if (!doc) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const format = ['reel', 'short', 'post', 'youtube'].includes(body.format) ? body.format : 'reel';
    const idea = `${doc.title || ''}\n${doc.content || ''}`.trim() || 'A short educational piece for my patients.';

    const fields = await getDoctorProfileFields(doctor._id);
    const gen = await structureContent({
      instruction: `Turn this idea into a ready-to-record ${format} script for an Indian doctor's own patient education. Return JSON: {"title": string (<=80 chars — a clear, specific title for this piece), "script": string}. The script must have: a one-line HOOK, then the body broken into short spoken beats (each on its own line, plain language a patient understands), and a calm closing line (e.g. "If this sounds like you, consult a specialist"). Keep it ~150-220 words — the length of a 45-60 second video. Ground it ONLY in the doctor's real profile and scope; do not invent conditions, procedures, statistics or claims.`,
      source: `Idea from the doctor:\n${idea}`,
      profileFields: fields,
      extraRules: 'FORMAT: this is spoken short-form video/social content, not a blog. No hashtags-as-keywords stuffing, no on-screen-text directions unless asked — just what the doctor says. Never promise outcomes or use "best/top".',
    });
    if (!gen.success || !gen.data?.script) {
      return NextResponse.json({ success: false, error: gen.error || 'Could not draft a script — try rephrasing the idea.' }, { status: 502 });
    }

    if (gen.data.title) doc.title = String(gen.data.title).slice(0, 200);
    doc.content = String(gen.data.script);
    if (doc.status === 'idea') doc.status = 'script';
    await doc.save();

    const { remaining } = await chargeAiCredits(doctor._id, { label: 'draft-script', tokens: gen.usage?.total_tokens || 0 });
    return NextResponse.json({
      success: true,
      creditsRemaining: remaining,
      document: { _id: doc._id, title: doc.title, content: doc.content, status: doc.status, plannedFor: doc.plannedFor || '', remindAt: doc.remindAt || null, kind: 'reel' },
    });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: "You've used all of today's AI credits. They reset tomorrow." }, { status: 402 });
    console.error('[draft-script]', error);
    return NextResponse.json({ success: false, error: 'Could not draft the script.' }, { status: 500 });
  }
}
