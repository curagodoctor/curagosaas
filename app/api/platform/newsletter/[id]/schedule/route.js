import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import Newsletter from '@/models/Newsletter';

export const runtime = 'nodejs';

// POST { scheduledFor: ISO } → mark as scheduled. POST { cancel: true } → back to draft.
export async function POST(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const nl = await Newsletter.findById(id);
    if (!nl) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    if (nl.status === 'sent') return NextResponse.json({ success: false, error: 'Already sent.' }, { status: 400 });

    const body = await request.json().catch(() => ({}));

    if (body.cancel) {
      nl.status = 'draft';
      nl.scheduledFor = undefined;
      await nl.save();
      return NextResponse.json({ success: true, status: 'draft' });
    }

    const when = new Date(body.scheduledFor);
    if (isNaN(when.getTime())) return NextResponse.json({ success: false, error: 'Invalid date/time.' }, { status: 400 });
    if (when.getTime() < Date.now() + 60 * 1000) {
      return NextResponse.json({ success: false, error: 'Pick a time at least a minute from now.' }, { status: 400 });
    }
    const hasContent = (nl.sections || []).some((s) => s.body && s.body.trim());
    if (!nl.subject?.trim() || !hasContent) {
      return NextResponse.json({ success: false, error: 'Add a subject and at least one section first.' }, { status: 400 });
    }
    if (!nl.segments?.length) {
      return NextResponse.json({ success: false, error: 'Select at least one audience segment.' }, { status: 400 });
    }

    nl.scheduledFor = when;
    nl.status = 'scheduled';
    await nl.save();
    return NextResponse.json({ success: true, status: 'scheduled', scheduledFor: when });
  } catch (error) {
    console.error('[Newsletter schedule]', error);
    return NextResponse.json({ success: false, error: 'Failed to schedule' }, { status: 500 });
  }
}
