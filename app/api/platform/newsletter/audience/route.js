import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import { getAudience, getSegmentCounts, SEGMENT_META } from '@/lib/newsletter/audience';

export const runtime = 'nodejs';

// GET ?segments=doctors,cohort,waitlist&sample=1
// Returns the deduped recipient count for the chosen segments, per-segment totals,
// and (optionally) a small sample of recipients for preview.
export async function GET(request) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const segments = (url.searchParams.get('segments') || '')
      .split(',').map((s) => s.trim()).filter(Boolean);
    const wantSample = url.searchParams.get('sample') === '1';

    const [counts, audience] = await Promise.all([
      getSegmentCounts(),
      getAudience(segments),
    ]);

    return NextResponse.json({
      success: true,
      segmentMeta: SEGMENT_META,
      counts,                       // per-source raw totals
      total: audience.total,        // deduped, suppression-filtered
      suppressed: audience.suppressed,
      sample: wantSample ? audience.recipients.slice(0, 20) : undefined,
    });
  } catch (error) {
    console.error('[Newsletter audience GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load audience' }, { status: 500 });
  }
}
