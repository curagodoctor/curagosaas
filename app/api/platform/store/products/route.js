import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAdminFromCookie, requirePlatformAdmin } from '@/lib/platformAdminAuth';
import StoreProduct from '@/models/store/Product';
import StorePurchase from '@/models/store/StorePurchase';
import { uniqueSlug } from '@/lib/store/products';
import { buildReaderHtml } from '@/lib/store/extract';

export const runtime = 'nodejs';

// Normalize the editable fields from the request body into a product patch.
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

// GET — list ALL products (admin), each with a buyer count.
export async function GET() {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const products = await StoreProduct.find().select('-readerHtml').sort({ order: 1, createdAt: -1 }).lean();
    const withCounts = await Promise.all(products.map(async (p) => ({
      ...p,
      buyers: await StorePurchase.countDocuments({ productId: p._id, status: 'completed' }),
      hasReader: undefined,
    })));
    return NextResponse.json({ success: true, products: withCounts });
  } catch (error) {
    console.error('[store products GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load products' }, { status: 500 });
  }
}

// POST — create a product. If it's a book with a file, extract reader HTML now.
export async function POST(request) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const body = await request.json();
    const fields = readFields(body);
    if (!fields.title) return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });

    fields.slug = await uniqueSlug(fields.title);
    if (fields.type === 'book' && fields.fileRef) {
      fields.readerHtml = await buildReaderHtml(fields.fileRef, fields.fileType);
    }
    const product = await StoreProduct.create(fields);
    return NextResponse.json({ success: true, product: { ...product.toObject(), readerHtml: undefined } });
  } catch (error) {
    console.error('[store products POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 });
  }
}
