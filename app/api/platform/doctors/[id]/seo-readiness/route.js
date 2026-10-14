import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import connectDB from '@/lib/mongodb';
import { getSeoReadiness } from '@/lib/practice-os/seoReadiness';

export const runtime = 'nodejs';

// GET — per-doctor SEO readiness / "needs data" report for the admin.
export async function GET(request, { params }) {
  const { authenticated } = await requirePlatformAdmin();
  if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await connectDB();
  const report = await getSeoReadiness(id);
  if (!report) return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
  return NextResponse.json({ success: true, ...report });
}
