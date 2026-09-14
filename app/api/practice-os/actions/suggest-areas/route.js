import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import { structureContent } from '@/lib/practice-os/ai';

export const runtime = 'nodejs';

// POST { city, specialty } — §5b: suggest the local areas/localities a doctor's
// online presence should mention for local SEO. Onboarding guidance, so it's not
// credit-charged.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { city, specialty } = await request.json();
    const c = String(city || '').trim();
    if (!c) return NextResponse.json({ success: false, error: 'Enter your city first.' }, { status: 400 });

    const gen = await structureContent({
      instruction: `The doctor practises in ${c}${specialty ? ` (${specialty})` : ''}. List 8–12 well-known localities, neighbourhoods or nearby towns within/around ${c} that patients would search from — the areas worth mentioning across the website and Google profile for local visibility. Return ONLY JSON: {"areas": [string]}. Real places only; no inventions.`,
      source: `City: ${c}. Specialty: ${specialty || ''}.`,
    });
    if (!gen.success) return NextResponse.json({ success: false, error: gen.error }, { status: 502 });
    const areas = Array.isArray(gen.data?.areas) ? gen.data.areas.map((a) => String(a).trim()).filter(Boolean).slice(0, 12) : [];
    return NextResponse.json({ success: true, areas });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[suggest-areas]', error);
    return NextResponse.json({ success: false, error: 'Could not suggest areas.' }, { status: 500 });
  }
}
