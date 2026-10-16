import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import { getDoctorProfileContext, getDoctorProfileFields } from '@/lib/practice-os/profile';
import { recordTextUsage } from '@/lib/practice-os/aiUsage';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST — AI-generate a milestones/roadmap timeline from the doctor's REAL profile
// (qualifications, training, experience). Never invents dates or achievements.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ success: false, error: 'AI is not configured.' }, { status: 503 });

    const [ctx, fields] = await Promise.all([
      getDoctorProfileContext(doctor._id).catch(() => ''),
      getDoctorProfileFields(doctor._id).catch(() => ({})),
    ]);
    if (!ctx && !fields.specialty) {
      return NextResponse.json({ success: false, error: 'Add your experience & qualifications to your profile first.' }, { status: 400 });
    }

    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const completion = await client.chat.completions.create({
      model, temperature: 0.5, max_tokens: 700, response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `Build a short professional milestones/roadmap timeline for this Indian doctor, from their REAL profile only (qualifications, training, years of experience, areas of expertise). Return STRICT JSON {"items":[{"year":"2015 or a phase label","title":"short milestone","description":"1 sentence"}]} with 4-6 milestones in chronological order. Use ONLY facts present in the profile — never invent dates, institutions, awards or achievements. If exact years aren't known, use phase labels ("Training", "Early practice", "Today") instead of made-up years. NMC-compliant: no superlatives or guarantees.` },
        { role: 'user', content: ctx || `Specialty: ${fields.specialty || ''}. Qualifications: ${fields.qualifications || ''}. Experience: ${fields.years_experience || ''}. Expertise: ${fields.expertise || ''}.` },
      ],
    });
    const u = completion.usage || {};
    recordTextUsage(doctor._id, { model, promptTokens: u.prompt_tokens, completionTokens: u.completion_tokens, totalTokens: u.total_tokens, source: 'generate-milestones' }).catch(() => {});

    const parsed = JSON.parse(completion.choices?.[0]?.message?.content || '{}');
    const items = Array.isArray(parsed.items)
      ? parsed.items.map((m) => ({ year: String(m.year || '').slice(0, 20), title: String(m.title || '').slice(0, 120), description: String(m.description || '').slice(0, 300) })).filter((m) => m.title).slice(0, 6)
      : [];
    if (!items.length) return NextResponse.json({ success: false, error: 'Could not generate milestones.' }, { status: 502 });
    return NextResponse.json({ success: true, items });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[generate-milestones]', error);
    return NextResponse.json({ success: false, error: 'Could not generate milestones.' }, { status: 500 });
  }
}
