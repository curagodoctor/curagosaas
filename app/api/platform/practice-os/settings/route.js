import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAdminFromCookie } from '@/lib/platformAdminAuth';
import PracticeOsSettings from '@/models/practice-os/PracticeOsSettings';
import { DEFAULT_GBP_GUIDE } from '@/lib/practice-os/gbpGuide';

export const runtime = 'nodejs';

// GET /api/platform/practice-os/settings — current Practice OS settings.
export async function GET() {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const settings = await PracticeOsSettings.getSettings();
    const gbpGuide = Array.isArray(settings.gbpGuide) && settings.gbpGuide.length ? settings.gbpGuide : DEFAULT_GBP_GUIDE;
    return NextResponse.json({ success: true, settings: { priceInInr: settings.priceInInr, gbpGuide } });
  } catch (error) {
    console.error('[Practice OS settings GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load settings' }, { status: 500 });
  }
}

const KINDS = ['DO NOT TOUCH', 'ONE-TIME', 'EDITABLE', 'LEARN'];

// PUT /api/platform/practice-os/settings — { priceInInr?, gbpGuide? }
export async function PUT(request) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const body = await request.json();
    const settings = await PracticeOsSettings.getSettings();

    if (body.priceInInr !== undefined) {
      const price = Number(body.priceInInr);
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ success: false, error: 'Enter a valid price in rupees.' }, { status: 400 });
      }
      settings.priceInInr = Math.round(price);
    }

    // §8b — the GBP setup guide (blocks + tasks). Sanitised; empty rows dropped.
    if (Array.isArray(body.gbpGuide)) {
      settings.gbpGuide = body.gbpGuide
        .map((b) => ({
          key: String(b.key || b.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'block',
          label: String(b.label || '').trim(),
          title: String(b.title || '').trim(),
          desc: String(b.desc || '').trim(),
          mandatory: !!b.mandatory,
          tasks: (Array.isArray(b.tasks) ? b.tasks : [])
            .map((t) => ({ label: String(t.label || '').trim(), hint: String(t.hint || '').trim(), kind: KINDS.includes(t.kind) ? t.kind : 'EDITABLE' }))
            .filter((t) => t.label),
        }))
        .filter((b) => b.label && b.tasks.length);
      settings.markModified('gbpGuide');
    }

    await settings.save();
    const gbpGuide = Array.isArray(settings.gbpGuide) && settings.gbpGuide.length ? settings.gbpGuide : DEFAULT_GBP_GUIDE;
    return NextResponse.json({ success: true, settings: { priceInInr: settings.priceInInr, gbpGuide } });
  } catch (error) {
    console.error('[Practice OS settings PUT]', error);
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}
