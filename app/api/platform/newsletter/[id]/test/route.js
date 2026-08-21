import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import Newsletter from '@/models/Newsletter';
import { sendNewsletterTest } from '@/lib/newsletter/send';

export const runtime = 'nodejs';

// POST { email } — send a single test copy to the given address.
export async function POST(request, { params }) {
  try {
    const { authenticated, admin } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const nl = await Newsletter.findById(id).lean();
    if (!nl) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const email = String(body.email || admin?.email || '').toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Enter a valid email.' }, { status: 400 });
    }

    const result = await sendNewsletterTest(nl, email, 'there');
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Test send failed.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error('[Newsletter test POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to send test' }, { status: 500 });
  }
}
