import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';

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

    const { message, sections = [], history = [] } = await request.json();
    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Empty message.' }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ success: false, error: 'AI is not configured.' }, { status: 500 });
    }

    const fields = await getDoctorProfileFields(doctor._id);
    // Compact section list for the prompt: index + type + current config.
    const brief = (Array.isArray(sections) ? sections : []).slice(0, 40)
      .map((s, i) => ({ index: i, type: s.type, config: s.config || {} }));

    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system = `You are the CuraGo website assistant for an Indian doctor. Their website is built from typed "sections", each with a JSON "config".
Rules:
- Keep everything NMC-compliant: informative, professional, no superlatives, no comparative or guaranteed-outcome claims, no soliciting patients.
- When the doctor asks to change something, pick the SINGLE most relevant section and return its FULL updated config — same keys and structure, changing only what the request needs. Never invent contact details, prices, or credentials that aren't in the profile.
- If the message is a question, a greeting, or you cannot map it to a section, set "edit" to null and just reply.
Return ONLY a JSON object: {"reply": string (1-3 short sentences, plain), "edit": {"index": number, "config": object} | null }.`;

    const profileLine = Object.entries(fields || {})
      .filter(([, v]) => v != null && String(v).trim())
      .slice(0, 30)
      .map(([k, v]) => `${k}: ${String(v).slice(0, 160)}`)
      .join('\n');
    const context = `Doctor profile (use where relevant, don't invent):\n${profileLine || '(none)'}\n\nCurrent website sections:\n${JSON.stringify(brief).slice(0, 12000)}`;

    const historyMsgs = (Array.isArray(history) ? history : []).slice(-8)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 1500) }))
      .filter((m) => m.content);

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      max_tokens: 1600,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: context },
        ...historyMsgs,
        { role: 'user', content: String(message).slice(0, 2000) },
      ],
    });

    const raw = (completion.choices?.[0]?.message?.content || '').trim();
    let data;
    try { data = JSON.parse(raw); } catch { return NextResponse.json({ success: false, error: 'Could not understand that — try rephrasing.' }, { status: 502 }); }

    // Validate the proposed edit against the sections we actually sent.
    let edit = null;
    const e = data.edit;
    if (e && typeof e === 'object' && Number.isInteger(e.index) && e.index >= 0 && e.index < brief.length && e.config && typeof e.config === 'object') {
      edit = { index: e.index, type: brief[e.index].type, config: e.config };
    }

    return NextResponse.json({ success: true, reply: String(data.reply || '').slice(0, 1200), edit });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    console.error('[site-chat]', error);
    return NextResponse.json({ success: false, error: 'The assistant is unavailable right now.' }, { status: 500 });
  }
}
