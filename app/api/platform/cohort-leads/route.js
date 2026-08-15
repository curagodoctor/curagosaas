import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAdminFromCookie, requirePlatformAdmin } from '@/lib/platformAdminAuth';
import CohortAssessment from '@/models/CohortAssessment';

export const runtime = 'nodejs';

// GET /api/platform/cohort-leads?result=&status=&format=
// Lists fit-assessment leads for the founder. ?format=csv downloads a spreadsheet.
export async function GET(request) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const url = new URL(request.url);
    const result = url.searchParams.get('result');
    const status = url.searchParams.get('status');
    const filter = {};
    if (result) filter.result = result;
    if (status) filter.status = status;

    const leads = await CohortAssessment.find(filter).sort({ createdAt: -1 }).limit(2000).lean();

    // Funnel counts (unfiltered) for the summary cards.
    const [total, started, completed, joined, strong, maybe, notfit] = await Promise.all([
      CohortAssessment.countDocuments({}),
      CohortAssessment.countDocuments({ startedAt: { $ne: null } }),
      CohortAssessment.countDocuments({ completedAt: { $ne: null } }),
      CohortAssessment.countDocuments({ clickedJoinCohort: true }),
      CohortAssessment.countDocuments({ result: 'strong_fit' }),
      CohortAssessment.countDocuments({ result: 'maybe' }),
      CohortAssessment.countDocuments({ result: 'not_fit' }),
    ]);

    if (url.searchParams.get('format') === 'csv') {
      const cols = ['Name', 'Email', 'Phone', 'Specialty', 'City', 'Result', 'Reason', 'Started', 'Completed', 'Clicked Join', 'Path', 'Status', 'Source'];
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const rows = leads.map((l) => [
        l.name, l.email, l.phone, l.specialty, l.city, l.result, l.reason,
        l.startedAt ? new Date(l.startedAt).toISOString().slice(0, 16).replace('T', ' ') : '',
        l.completedAt ? new Date(l.completedAt).toISOString().slice(0, 16).replace('T', ' ') : '',
        l.clickedJoinCohort ? 'yes' : '', l.chosenPath, l.status, l.source,
      ].map(esc).join(','));
      const csv = [cols.join(','), ...rows].join('\n');
      return new Response(csv, {
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="cohort-leads-${new Date().toISOString().slice(0, 10)}.csv"` },
      });
    }

    return NextResponse.json({ success: true, leads, funnel: { total, started, completed, joined, strong, maybe, notfit } });
  } catch (error) {
    console.error('[Cohort leads GET]', error.message);
    return NextResponse.json({ success: false, error: 'Failed to load leads' }, { status: 500 });
  }
}

// PATCH /api/platform/cohort-leads — { id, status } — update a lead's status.
export async function PATCH(request) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id, status } = await request.json();
    if (!id || !['new', 'reviewing', 'onboarded', 'declined'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid id or status' }, { status: 400 });
    }
    await CohortAssessment.findByIdAndUpdate(id, { $set: { status } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Cohort leads PATCH]', error.message);
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 });
  }
}
