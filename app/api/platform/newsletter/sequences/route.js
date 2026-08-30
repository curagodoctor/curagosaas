import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import NewsletterSequence from '@/models/NewsletterSequence';
import SequenceSubscriber from '@/models/SequenceSubscriber';

export const runtime = 'nodejs';

// GET — list sequences with subscriber counts.
export async function GET() {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const sequences = await NewsletterSequence.find().sort({ createdAt: -1 }).lean();
    const counts = await SequenceSubscriber.aggregate([
      { $group: { _id: { seq: '$sequenceId', status: '$status' }, n: { $sum: 1 } } },
    ]);
    const bySeq = {};
    for (const c of counts) {
      const k = String(c._id.seq);
      bySeq[k] = bySeq[k] || { active: 0, completed: 0, unsubscribed: 0, total: 0 };
      bySeq[k][c._id.status] = c.n; bySeq[k].total += c.n;
    }
    return NextResponse.json({ success: true, sequences: sequences.map((s) => ({ ...s, counts: bySeq[String(s._id)] || { active: 0, completed: 0, unsubscribed: 0, total: 0 } })) });
  } catch (error) {
    console.error('[Sequences GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load sequences' }, { status: 500 });
  }
}

// POST — create a sequence.
export async function POST(request) {
  try {
    const { authenticated, admin } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const seq = await NewsletterSequence.create({
      name: (body.name || 'Untitled sequence').trim(),
      steps: [],
      enabled: false,
      autoEnroll: body.autoEnroll !== false,
      createdBy: admin?.email || '',
    });
    return NextResponse.json({ success: true, sequence: seq }, { status: 201 });
  } catch (error) {
    console.error('[Sequences POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to create sequence' }, { status: 500 });
  }
}
