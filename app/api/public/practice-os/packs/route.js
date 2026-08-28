import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Framework from '@/models/practice-os/Framework';
import Mission from '@/models/practice-os/Mission';
import { computeGst } from '@/lib/practice-os/access';

export const runtime = 'nodejs';

// GET /api/public/practice-os/packs — public catalogue of published, active packs.
// No auth. Safe fields only, plus a mission/task count and price breakdown.
export async function GET() {
  try {
    await connectDB();
    const frameworks = await Framework.find({ isPublished: true, isActive: true })
      .select('title slug tagline summary description category coverImage outcomes priceInInr mode order')
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const ids = frameworks.map((f) => f._id);
    // Count published missions per pack in one query.
    const counts = ids.length
      ? await Mission.aggregate([
          { $match: { frameworkId: { $in: ids }, status: 'published' } },
          { $group: { _id: '$frameworkId', n: { $sum: 1 } } },
        ])
      : [];
    const countBy = new Map(counts.map((c) => [String(c._id), c.n]));

    const packs = frameworks.map((f) => {
      const price = Math.max(0, f.priceInInr || 0);
      const g = computeGst(price);
      const itemCount = countBy.get(String(f._id)) || 0;
      return {
        slug: f.slug,
        title: f.title,
        tagline: f.tagline || '',
        summary: f.summary || f.description || '',
        category: f.category || '',
        coverImage: f.coverImage || '',
        outcomes: f.outcomes || [],
        mode: f.mode || 'mission',
        itemCount,
        itemLabel: (f.mode === 'task') ? 'tasks' : 'missions',
        price: { base: g.base, gst: g.gst, total: g.total, pct: g.pct, free: price <= 0 },
      };
    });

    return NextResponse.json({ success: true, packs });
  } catch (error) {
    console.error('[Public packs]', error);
    return NextResponse.json({ success: false, error: 'Failed to load packs' }, { status: 500 });
  }
}
