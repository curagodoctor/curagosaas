import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import Newsletter from '@/models/Newsletter';
import { sendNewsletter } from '@/lib/newsletter/send';

export const runtime = 'nodejs';
export const maxDuration = 60;   // allow time for batch sends

// POST — send this newsletter to its segments now. Idempotent-ish: refuses to
// re-send an already-sent newsletter.
export async function POST(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const nl = await Newsletter.findById(id);
    if (!nl) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    if (nl.status === 'sent') {
      return NextResponse.json({ success: false, error: 'This newsletter has already been sent.' }, { status: 400 });
    }
    if (nl.status === 'sending') {
      return NextResponse.json({ success: false, error: 'This newsletter is already sending.' }, { status: 400 });
    }
    const hasContent = (nl.sections || []).some((s) => s.body && s.body.trim());
    if (!nl.subject?.trim() || !hasContent) {
      return NextResponse.json({ success: false, error: 'Add a subject and at least one section before sending.' }, { status: 400 });
    }
    if (!nl.segments?.length) {
      return NextResponse.json({ success: false, error: 'Select at least one audience segment.' }, { status: 400 });
    }

    // Claim the send atomically so a double-click can't send twice.
    const claimed = await Newsletter.findOneAndUpdate(
      { _id: id, status: { $in: ['draft'] } },
      { $set: { status: 'sending' } },
      { new: true }
    );
    if (!claimed) {
      return NextResponse.json({ success: false, error: 'Could not start the send (already in progress?).' }, { status: 409 });
    }

    let stats;
    try {
      stats = await sendNewsletter(nl);
    } catch (e) {
      await Newsletter.updateOne({ _id: id }, { $set: { status: 'draft' } });
      console.error('[Newsletter send]', e?.message);
      return NextResponse.json({ success: false, error: 'Send failed. Please try again.' }, { status: 500 });
    }

    await Newsletter.updateOne(
      { _id: id },
      { $set: { status: 'sent', sentAt: new Date(), stats } }
    );

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('[Newsletter send POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to send' }, { status: 500 });
  }
}
