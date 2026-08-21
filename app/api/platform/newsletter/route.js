import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import Newsletter, { NEWSLETTER_SECTIONS, NEWSLETTER_SEGMENTS } from '@/models/Newsletter';

export const runtime = 'nodejs';

// GET — list all newsletters (newest first).
export async function GET() {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const items = await Newsletter.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('[Newsletter GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load newsletters' }, { status: 500 });
  }
}

// POST — create a draft, pre-seeded with the 9 template sections.
export async function POST(request) {
  try {
    const { authenticated, admin } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const body = await request.json().catch(() => ({}));

    const doc = await Newsletter.create({
      subject: (body.subject || 'Untitled newsletter').trim(),
      preheader: body.preheader || '',
      intro: body.intro || undefined,
      segments: Array.isArray(body.segments)
        ? body.segments.filter((s) => NEWSLETTER_SEGMENTS.includes(s))
        : NEWSLETTER_SEGMENTS,
      sections: NEWSLETTER_SECTIONS.map((s) => ({ key: s.key, heading: s.label, body: '' })),
      createdBy: admin?.email || '',
      status: 'draft',
    });

    return NextResponse.json({ success: true, item: doc }, { status: 201 });
  } catch (error) {
    console.error('[Newsletter POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to create newsletter' }, { status: 500 });
  }
}
