import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';
import PracticeOsDiseaseCluster from '@/models/practice-os/PracticeOsDiseaseCluster';

export const runtime = 'nodejs';

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const splitList = (s) => String(s || '').split(/[,\n;|]/).map((x) => x.trim()).filter(Boolean);

// GET — the doctor's disease clusters. Seeds them from the profile's "diseases"
// (with treatments pre-filled from the profile's "procedures") the first time,
// so the review screen always has something to show.
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    // The paid disease mapping is generated fresh from the specialty via
    // POST /clusters/generate (the doctor's page triggers it when empty), so GET
    // just returns whatever exists — no profile-based seeding here.
    const clusters = await PracticeOsDiseaseCluster.find({ doctorId: doctor._id }).sort({ order: 1, createdAt: 1 }).lean();
    return NextResponse.json({ success: true, clusters });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'PaymentRequired') return NextResponse.json({ success: false, error: 'PaymentRequired' }, { status: 402 });
    console.error('[clusters GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load' }, { status: 500 });
  }
}

// POST { name } — add a new disease cluster.
export async function POST(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();
    const { name, kind } = await request.json().catch(() => ({}));
    const clean = String(name || '').trim();
    if (!clean) return NextResponse.json({ success: false, error: 'Enter a name.' }, { status: 400 });
    const count = await PracticeOsDiseaseCluster.countDocuments({ doctorId: doctor._id });
    // In treatment-mode, the entry IS a treatment (name = treatment, itself beneath).
    const isTreatment = kind === 'treatment';
    const cluster = await PracticeOsDiseaseCluster.create({
      doctorId: doctor._id, name: clean, slug: slugify(clean), kind: isTreatment ? 'treatment' : 'disease',
      treatments: isTreatment ? [{ name: clean, source: 'manual' }] : [], order: count,
    });
    return NextResponse.json({ success: true, cluster });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[clusters POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to add' }, { status: 500 });
  }
}
