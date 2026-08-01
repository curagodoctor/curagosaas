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
    return NextResponse.json({ success: true, settings: { priceInInr: settings.priceInInr } });
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

    const { priceInInr } = await request.json();
    const price = Number(priceInInr);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ success: false, error: 'Enter a valid price in rupees.' }, { status: 400 });
    }

    const settings = await PracticeOsSettings.getSettings();
    settings.priceInInr = Math.round(price);
    await settings.save();
    return NextResponse.json({ success: true, settings: { priceInInr: settings.priceInInr } });
  } catch (error) {
    console.error('[Practice OS settings PUT]', error);
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}
