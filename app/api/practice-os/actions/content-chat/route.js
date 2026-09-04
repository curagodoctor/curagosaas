import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor, assertAiAccess } from '@/lib/practice-os/access';
import { assertHasCredits, chargeAiCredits } from '@/lib/practice-os/aiCredits';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';
import { getKnowledgeContext } from '@/lib/practice-os/knowledge';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST { message, history } — a conversational content assistant for the AI
// Website Builder (draft/refine blog + website copy). Same spirit as the mission
// assistant but not scoped to a mission. Grounded in the doctor's full profile +
// knowledge base; paid-tier + credit-metered. Each reply can be turned into a
// blog draft by the client (via draft-blog).
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    await assertAiAccess(doctor._id);

    const { message, history = [] } = await request.json();
    if (!message || !message.trim()) return NextResponse.json({ success: false, error: 'Empty message.' }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ success: false, error: 'AI is not configured.' }, { status: 500 });
    await assertHasCredits(doctor._id);

    const fields = await getDoctorProfileFields(doctor._id);
    const profileLine = Object.entries(fields)
      .filter(([, v]) => v != null && String(v).trim())
      .slice(0, 30)
      .map(([k, v]) => `${k}: ${String(v).slice(0, 160)}`)
      .join('\n');
    let knowledge = '';
    try { knowledge = await getKnowledgeContext(null, message); } catch { /* ignore */ }

    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const system = `You are the CuraGo content assistant for an Indian doctor. You help draft and refine blog articles and website copy for their clinic site.
Rules:
- Drafting/formatting help only; no medical, legal or regulatory advice.
- NMC-compliant: informative and educational, no superlatives, no comparative or guaranteed-outcome claims, no soliciting patients.
- Ground everything in the doctor profile + knowledge base below; never invent credentials, statistics, prices or locations.
- Be thorough and ready to paste. When asked for an article, write it in full with clear headings. Use light Markdown.`;
    const ctx = `Doctor profile:\n${profileLine || '(none)'}\n\nKnowledge base (reference; don't quote headers):\n${(knowledge || '(none)').slice(0, 6000)}`;
    const historyMsgs = (Array.isArray(history) ? history : []).slice(-10)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 3000) }))
      .filter((m) => m.content);

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_LONG_MODEL || 'gpt-4o',
      max_tokens: Math.max(1500, Number(process.env.OPENAI_LONG_MAX_TOKENS) || 4096),
      temperature: 0.6,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: ctx },
        ...historyMsgs,
        { role: 'user', content: String(message).slice(0, 3000) },
      ],
    });
    const text = (completion.choices?.[0]?.message?.content || '').trim();
    if (!text) return NextResponse.json({ success: false, error: 'The assistant returned an empty response.' }, { status: 502 });

    const { remaining } = await chargeAiCredits(doctor._id, { label: 'content-chat', tokens: completion.usage?.total_tokens || 0 });
    return NextResponse.json({ success: true, reply: text, creditsRemaining: remaining });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    if (error.code === 'NoCredits') return NextResponse.json({ success: false, error: 'NoCredits', message: "You've used all of today's AI credits. They reset tomorrow." }, { status: 402 });
    console.error('[content-chat]', error);
    return NextResponse.json({ success: false, error: 'The assistant is unavailable right now.' }, { status: 500 });
  }
}
