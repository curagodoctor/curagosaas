import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import StoreProduct from '@/models/store/Product';
import { buildReaderHtml } from '@/lib/store/extract';

export const runtime = 'nodejs';

function readFields(body) {
  const type = ['course', 'bundle'].includes(body.type) ? body.type : 'book';
  const lessons = Array.isArray(body.lessons)
    ? body.lessons.map((l, i) => ({ title: String(l.title || '').trim(), videoRef: String(l.videoRef || '').trim(), durationLabel: String(l.durationLabel || '').trim(), order: Number.isFinite(l.order) ? l.order : i }))
      .filter((l) => l.title || l.videoRef)
    : [];
  return {
    title: String(body.title || '').trim(),
    type,
    summary: String(body.summary || '').trim(),
    description: String(body.description || '').trim(),
    coverImage: String(body.coverImage || '').trim(),
    priceInInr: Math.max(0, Number(body.priceInInr) || 0),
    fileRef: type === 'book' ? String(body.fileRef || '').trim() : '',
    fileType: type === 'book' ? String(body.fileType || '').toLowerCase().trim() : '',
    lessons: type === 'course' ? lessons : [],
    bundleItems: type === 'bundle' && Array.isArray(body.bundleItems) ? body.bundleItems.filter((x) => /^[a-f0-9]{24}$/i.test(String(x))) : [],
    isPublished: !!body.isPublished,
    order: Number.isFinite(body.order) ? body.order : 0,
  };
}

// PUT — update a product. Re-extracts reader HTML only when the book file changed.
export async function PUT(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;

    const existing = await StoreProduct.findById(id).select('fileRef').lean();
    if (!existing) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });

    const body = await request.json();
    const fields = readFields(body);
    if (!fields.title) return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });

    // Rebuild the reader only when the book file reference actually changed.
    if (fields.type === 'book' && fields.fileRef && fields.fileRef !== existing.fileRef) {
      fields.readerHtml = await buildReaderHtml(fields.fileRef, fields.fileType);
    } else if (fields.type === 'course' || !fields.fileRef) {
      fields.readerHtml = '';
    }

    const product = await StoreProduct.findByIdAndUpdate(id, { $set: fields }, { new: true }).select('-readerHtml').lean();
    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('[store products PUT]', error);
    return NextResponse.json({ success: false, error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE — remove a product (existing purchases are left intact for the record).
export async function DELETE(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    await StoreProduct.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[store products DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete product' }, { status: 500 });
  }
}
