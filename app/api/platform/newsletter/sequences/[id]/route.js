import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import NewsletterSequence from '@/models/NewsletterSequence';
import SequenceSubscriber from '@/models/SequenceSubscriber';

export const runtime = 'nodejs';

// GET — one sequence.
export async function GET(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const seq = await NewsletterSequence.findById(id).lean();
    if (!seq) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    const active = await SequenceSubscriber.countDocuments({ sequenceId: id, status: 'active' });
    const total = await SequenceSubscriber.countDocuments({ sequenceId: id });
    return NextResponse.json({ success: true, sequence: seq, counts: { active, total } });
  } catch (error) {
    console.error('[Sequence GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load' }, { status: 500 });
  }
}

// PATCH — update name / steps / enabled / autoEnroll.
export async function PATCH(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const seq = await NewsletterSequence.findById(id);
    if (!seq) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    const body = await request.json();

    if (typeof body.name === 'string' && body.name.trim()) seq.name = body.name.trim();
    if (typeof body.autoEnroll === 'boolean') seq.autoEnroll = body.autoEnroll;
    if (Array.isArray(body.steps)) {
      seq.steps = body.steps
        .filter((s) => s && s.newsletterId)
        .map((s) => ({ newsletterId: s.newsletterId, delayDays: Math.max(0, Number(s.delayDays) || 0) }));
    }
    if (typeof body.enabled === 'boolean') {
      if (body.enabled && (!seq.steps || seq.steps.length === 0)) {
        return NextResponse.json({ success: false, error: 'Add at least one step before enabling.' }, { status: 400 });
      }
      seq.enabled = body.enabled;
    }
    await seq.save();
    return NextResponse.json({ success: true, sequence: seq });
  } catch (error) {
    console.error('[Sequence PATCH]', error);
    return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 });
  }
}

// DELETE — remove a sequence + its subscribers.
export async function DELETE(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    await NewsletterSequence.deleteOne({ _id: id });
    await SequenceSubscriber.deleteMany({ sequenceId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Sequence DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
  }
}
