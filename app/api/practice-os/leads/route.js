import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import Contact from '@/models/Contact';

export const runtime = 'nodejs';

// GET /api/practice-os/leads — the doctor's website "Request a call back" form
// submissions (Contacts created by the site lead form). Doctor-scoped; not behind
// the premium Contacts gate, so every doctor can see their own website enquiries.
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const rows = await Contact.find({ doctorId: doctor._id, source: 'website-lead-form' })
      .sort({ createdAt: -1 })
      .limit(300)
      .select('name phone email notes status createdAt')
      .lean();
    const leads = rows.map((r) => ({
      id: String(r._id),
      name: r.name || '',
      phone: r.phone || '',
      email: r.email || '',
      message: r.notes || '',
      status: r.status || 'new',
      createdAt: r.createdAt,
    }));
    return NextResponse.json({ success: true, leads, total: leads.length });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    console.error('[practice-os leads]', error);
    return NextResponse.json({ success: false, error: 'Failed to load enquiries' }, { status: 500 });
  }
}
