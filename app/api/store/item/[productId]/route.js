import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import StoreProduct from '@/models/store/Product';
import { hasStoreProduct } from '@/lib/store/grant';
import { buildReaderHtml } from '@/lib/store/extract';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/store/item/<productId> — everything the reader/player page needs for a
// product the doctor OWNS. Book → extracted reader HTML; course → lesson list
// (video is streamed separately via /api/store/stream, ownership-gated there too).
export async function GET(request, { params }) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();
    const { productId } = await params;

    if (!(await hasStoreProduct(doctor._id, productId))) {
      return NextResponse.json({ success: false, error: 'You do not own this item.' }, { status: 403 });
    }
    const p = await StoreProduct.findById(productId).lean();
    if (!p) return NextResponse.json({ success: false, error: 'Not found.' }, { status: 404 });

    if (p.type === 'course') {
      const lessons = (p.lessons || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((l) => ({ id: String(l._id), title: l.title || 'Lesson', durationLabel: l.durationLabel || '' }));
      return NextResponse.json({ success: true, type: 'course', title: p.title, description: p.description || '', lessons });
    }

    let html = p.readerHtml;
    if (!html && p.fileRef) {
      html = await buildReaderHtml(p.fileRef, p.fileType);
      if (html) await StoreProduct.updateOne({ _id: p._id }, { $set: { readerHtml: html } });
    }
    return NextResponse.json({ success: true, type: 'book', title: p.title, fileType: p.fileType || '', html: html || '<p>This book could not be displayed. Please contact support.</p>' });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[store item]', error);
    return NextResponse.json({ success: false, error: 'Could not open this item.' }, { status: 500 });
  }
}
