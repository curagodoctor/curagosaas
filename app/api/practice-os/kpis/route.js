import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import KpiEntry from '@/models/practice-os/KpiEntry';

export const runtime = 'nodejs';

// GET /api/practice-os/kpis — KPI datapoints grouped into time-series per metric (§11).
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const packId = new URL(request.url).searchParams.get('pack');
    const filter = { doctorId: doctor._id, ...(packId ? { frameworkId: packId } : {}) };
    const rows = await KpiEntry.find(filter).sort({ recordedAt: 1 }).lean();

    const byKey = new Map();
    for (const r of rows) {
      if (!byKey.has(r.key)) byKey.set(r.key, { key: r.key, label: r.label || r.key, unit: r.unit || '', points: [] });
      byKey.get(r.key).points.push({ recordedAt: r.recordedAt, value: r.value });
    }

    return NextResponse.json({ success: true, series: Array.from(byKey.values()) });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    console.error('[Practice OS kpis]', error);
    return NextResponse.json({ success: false, error: 'Failed to load KPIs' }, { status: 500 });
  }
}
