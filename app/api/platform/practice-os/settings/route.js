import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAdminFromCookie } from '@/lib/platformAdminAuth';
import PracticeOsSettings from '@/models/practice-os/PracticeOsSettings';

export const runtime = 'nodejs';

// GET /api/platform/practice-os/settings — current Practice OS settings.
export async function GET() {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const settings = await PracticeOsSettings.getSettings();
    return NextResponse.json({ success: true, settings: { priceInInr: settings.priceInInr, orientationVideos: settings.orientationVideos || [] } });
  } catch (error) {
    console.error('[Practice OS settings GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load settings' }, { status: 500 });
  }
}

// PUT /api/platform/practice-os/settings — { priceInInr }
export async function PUT(request) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const body = await request.json();
    const settings = await PracticeOsSettings.getSettings();

    // Price is optional now — only validate/update when provided.
    if (body.priceInInr !== undefined) {
      const price = Number(body.priceInInr);
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ success: false, error: 'Enter a valid price in rupees.' }, { status: 400 });
      }
      settings.priceInInr = Math.round(price);
    }

    // §6 orientation videos — replace the whole ordered list when provided.
    if (Array.isArray(body.orientationVideos)) {
      settings.orientationVideos = body.orientationVideos
        .map((v, i) => ({
          title: (v.title || '').trim(),
          description: (v.description || '').trim(),
          videoUrl: (v.videoUrl || '').trim(),
          order: Number.isFinite(Number(v.order)) ? Number(v.order) : i,
        }))
        .filter((v) => v.title && v.videoUrl)
        .sort((a, b) => a.order - b.order)
        .map((v, i) => ({ ...v, order: i }));
    }

    await settings.save();
    return NextResponse.json({ success: true, settings: { priceInInr: settings.priceInInr, orientationVideos: settings.orientationVideos } });
  } catch (error) {
    console.error('[Practice OS settings PUT]', error);
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}
