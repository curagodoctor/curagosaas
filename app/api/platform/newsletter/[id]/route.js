import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import Newsletter, { NEWSLETTER_SECTIONS, NEWSLETTER_SEGMENTS } from '@/models/Newsletter';

export const runtime = 'nodejs';

const SECTION_KEYS = new Set(NEWSLETTER_SECTIONS.map((s) => s.key));

// GET — one newsletter.
export async function GET(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const item = await Newsletter.findById(id).lean();
    if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('[Newsletter GET one]', error);
    return NextResponse.json({ success: false, error: 'Failed to load' }, { status: 500 });
  }
}

// PATCH — save edits to a draft (subject, preheader, intro, CTA, sections, segments).
export async function PATCH(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const nl = await Newsletter.findById(id);
    if (!nl) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    if (nl.status === 'sent') {
      return NextResponse.json({ success: false, error: 'This newsletter has already been sent and cannot be edited.' }, { status: 400 });
    }

    const body = await request.json();
    if (typeof body.subject === 'string') nl.subject = body.subject.trim() || nl.subject;
    if (typeof body.preheader === 'string') nl.preheader = body.preheader;
    if (typeof body.intro === 'string') nl.intro = body.intro;
    if (typeof body.ctaLabel === 'string') nl.ctaLabel = body.ctaLabel;
    if (typeof body.ctaUrl === 'string') nl.ctaUrl = body.ctaUrl;
    if (Array.isArray(body.segments)) {
      nl.segments = body.segments.filter((s) => NEWSLETTER_SEGMENTS.includes(s));
    }
    if (Array.isArray(body.sections)) {
      // Keep template order + keys; only accept known keys.
      const incoming = new Map(body.sections.filter((s) => SECTION_KEYS.has(s.key)).map((s) => [s.key, s]));
      nl.sections = NEWSLETTER_SECTIONS.map((meta) => {
        const s = incoming.get(meta.key) || nl.sections.find((x) => x.key === meta.key) || {};
        return { key: meta.key, heading: (s.heading ?? meta.label) || meta.label, body: s.body ?? '' };
      });
    }
    await nl.save();
    return NextResponse.json({ success: true, item: nl });
  } catch (error) {
    console.error('[Newsletter PATCH]', error);
    return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 });
  }
}

// DELETE — remove a newsletter (drafts or sent archives).
export async function DELETE(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    await Newsletter.deleteOne({ _id: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Newsletter DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
  }
}
