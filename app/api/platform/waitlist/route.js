import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAdminFromCookie } from '@/lib/platformAdminAuth';
import Waitlist from '@/models/Waitlist';

export const runtime = 'nodejs';

// GET /api/platform/waitlist  — the older landing-page email captures.
// ?format=csv downloads them.
export async function GET(request) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const entries = await Waitlist.find().sort({ createdAt: -1 }).limit(5000).lean();

    if (new URL(request.url).searchParams.get('format') === 'csv') {
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const rows = entries.map((e) => [e.email, e.name, e.source, e.createdAt ? new Date(e.createdAt).toISOString().slice(0, 16).replace('T', ' ') : ''].map(esc).join(','));
      const csv = ['Email,Name,Source,Joined', ...rows].join('\n');
      return new Response(csv, {
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="waitlist-${new Date().toISOString().slice(0, 10)}.csv"` },
      });
    }

    return NextResponse.json({ success: true, entries, total: entries.length });
  } catch (error) {
    console.error('[Waitlist admin GET]', error.message);
    return NextResponse.json({ success: false, error: 'Failed to load waitlist' }, { status: 500 });
  }
}
