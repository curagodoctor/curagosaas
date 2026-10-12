import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import StoreProduct from '@/models/store/Product';
import { hasStoreProduct } from '@/lib/store/grant';
import { buildReaderHtml } from '@/lib/store/extract';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/store/read/<productId> — the in-app reader content for a book the
// doctor OWNS. Returns extracted HTML only; the original file is never served.
export async function GET(request, { params }) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();
    const { productId } = await params;

    if (!(await hasStoreProduct(doctor._id, productId))) {
      return NextResponse.json({ success: false, error: 'You do not own this book.' }, { status: 403 });
    }
    const p = await StoreProduct.findById(productId).lean();
    if (!p || p.type !== 'book') return NextResponse.json({ success: false, error: 'Not a readable book.' }, { status: 404 });

    // Self-heal: if extraction didn't run at upload, build it now and cache it.
    let html = p.readerHtml;
    if (!html && p.fileRef) {
      html = await buildReaderHtml(p.fileRef, p.fileType);
      if (html) await StoreProduct.updateOne({ _id: p._id }, { $set: { readerHtml: html } });
    }

    return NextResponse.json({ success: true, title: p.title, fileType: p.fileType || '', html: html || '<p>This book could not be displayed. Please contact support.</p>' });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[store read]', error);
    return NextResponse.json({ success: false, error: 'Could not open the book.' }, { status: 500 });
  }
}
