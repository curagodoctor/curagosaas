import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAdminFromCookie, requirePlatformAdmin } from '@/lib/platformAdminAuth';
import Framework from '@/models/practice-os/Framework';
import Module from '@/models/practice-os/Module';
import Mission from '@/models/practice-os/Mission';
import { slugify } from '@/lib/practice-os/import-helpers';

// GET /api/platform/practice-os/frameworks — list frameworks with counts.
export async function GET() {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const frameworks = await Framework.find().sort({ order: 1, createdAt: 1 }).lean();

    // Attach module + mission counts per framework.
    const withCounts = await Promise.all(
      frameworks.map(async (fw) => {
        const [moduleCount, missionCount] = await Promise.all([
          Module.countDocuments({ frameworkId: fw._id }),
          Mission.countDocuments({ frameworkId: fw._id }),
        ]);
        return { ...fw, moduleCount, missionCount };
      })
    );

    return NextResponse.json({ success: true, frameworks: withCounts });
  } catch (error) {
    console.error('[Practice OS Frameworks GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load frameworks' }, { status: 500 });
  }
}

// POST /api/platform/practice-os/frameworks — create a framework.
export async function POST(request) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const body = await request.json();
    const title = (body.title || '').trim();
    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }
    const slug = body.slug ? slugify(body.slug) : slugify(title);

    const existing = await Framework.findOne({ slug });
    if (existing) {
      return NextResponse.json({ success: false, error: 'A framework with this name already exists' }, { status: 409 });
    }

    const outcomes = Array.isArray(body.outcomes)
      ? body.outcomes.map((o) => String(o).trim()).filter(Boolean)
      : String(body.outcomes || '').split('\n').map((o) => o.trim()).filter(Boolean);

    const framework = await Framework.create({
      title,
      slug,
      description: body.description || '',
      category: body.category || '',
      coverImage: body.coverImage || '',
      tagline: body.tagline || '',
      summary: body.summary || '',
      outcomes,
      priceInInr: Math.max(0, Number(body.priceInInr) || 0),
      mode: body.mode === 'task' ? 'task' : 'mission',
      isPublished: body.isPublished ?? false,
      order: body.order ?? 0,
      isActive: body.isActive ?? true,
    });

    return NextResponse.json({ success: true, framework });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Practice OS Frameworks POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to create framework' }, { status: 500 });
  }
}
