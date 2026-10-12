import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import StoreProduct from '@/models/store/Product';
import { hasStoreProduct } from '@/lib/store/grant';
import { getSignedReadUrl } from '@/lib/gcs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/store/stream/<productId>?lesson=<lessonId> — 302-redirect to a short-
// lived signed video URL for a course lesson the doctor OWNS. Redirecting keeps
// the <video src> stable across range/seek requests without exposing the bucket.
export async function GET(request, { params }) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();
    const { productId } = await params;
    const lessonId = new URL(request.url).searchParams.get('lesson');

    if (!(await hasStoreProduct(doctor._id, productId))) {
      return NextResponse.json({ success: false, error: 'You do not own this course.' }, { status: 403 });
    }
    const p = await StoreProduct.findById(productId).select('type lessons').lean();
    if (!p || p.type !== 'course') return NextResponse.json({ success: false, error: 'Not a course.' }, { status: 404 });

    const lesson = (p.lessons || []).find((l) => String(l._id) === String(lessonId)) || (p.lessons || [])[0];
    if (!lesson?.videoRef) return NextResponse.json({ success: false, error: 'Lesson video not found.' }, { status: 404 });

    const url = await getSignedReadUrl(lesson.videoRef, { expiresMs: 6 * 60 * 60 * 1000 });
    if (!url) return NextResponse.json({ success: false, error: 'Video is unavailable.' }, { status: 502 });
    return NextResponse.redirect(url, 302);
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[store stream]', error);
    return NextResponse.json({ success: false, error: 'Could not stream the video.' }, { status: 500 });
  }
}
