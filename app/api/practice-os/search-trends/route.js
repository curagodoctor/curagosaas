import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import { requireTierFeatureOr403 } from '@/lib/accessTier';
import { getOrRefreshTrendsForDoctor } from '@/lib/practice-os/searchTrends';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — this week's patient search-trends for the signed-in doctor. Lazily
// fetches + summarises once per specialty+city per week (shared cache), so a
// normal page load never triggers more than one SerpAPI fetch per combination.
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    // Paid/DOS only — free users can't trigger SerpAPI/OpenAI spend by hitting
    // the endpoint directly (the sidebar already hides it, this enforces it).
    const locked = await requireTierFeatureOr403(doctor._id, 'analytics');
    if (locked) return locked;
    const { status, report } = await getOrRefreshTrendsForDoctor(doctor._id);
    return NextResponse.json({
      success: true,
      status,
      report: report ? {
        specialty: report.specialty,
        city: report.city,
        weekStart: report.weekStart,
        fetchedAt: report.fetchedAt,
        summary: report.summary,
        suggestedTopics: report.suggestedTopics || [],
        queries: report.queries || [],
      } : null,
    });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[search-trends]', error);
    return NextResponse.json({ success: false, error: 'Could not load search trends.' }, { status: 500 });
  }
}
