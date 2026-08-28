import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Framework from '@/models/practice-os/Framework';
import Mission from '@/models/practice-os/Mission';
import { computeGst } from '@/lib/practice-os/access';

export const runtime = 'nodejs';

// GET /api/public/practice-os/packs/[slug] — full public detail for one pack.
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { slug } = await params;
    const f = await Framework.findOne({ slug: String(slug).toLowerCase(), isPublished: true, isActive: true })
      .select('title slug tagline summary description category coverImage outcomes priceInInr mode')
      .lean();
    if (!f) return NextResponse.json({ success: false, error: 'Pack not found' }, { status: 404 });

    // A light outline of what's inside (titles only) — enough to sell it.
    const missions = await Mission.find({ frameworkId: f._id, status: 'published' })
      .select('missionText category weekNumber dayNumber missionNumber')
      .sort({ weekNumber: 1, dayNumber: 1, missionNumber: 1 })
      .lean();

    const price = Math.max(0, f.priceInInr || 0);
    const g = computeGst(price);

    return NextResponse.json({
      success: true,
      pack: {
        slug: f.slug,
        title: f.title,
        tagline: f.tagline || '',
        summary: f.summary || f.description || '',
        category: f.category || '',
        coverImage: f.coverImage || '',
        outcomes: f.outcomes || [],
        mode: f.mode || 'mission',
        itemLabel: (f.mode === 'task') ? 'tasks' : 'missions',
        items: missions.map((m, i) => ({ n: i + 1, title: m.missionText || m.category || 'Untitled' })),
        price: { base: g.base, gst: g.gst, total: g.total, pct: g.pct, free: price <= 0 },
      },
    });
  } catch (error) {
    console.error('[Public pack detail]', error);
    return NextResponse.json({ success: false, error: 'Failed to load pack' }, { status: 500 });
  }
}
