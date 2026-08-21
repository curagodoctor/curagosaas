import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import NewsletterSettings from '@/models/NewsletterSettings';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const s = await NewsletterSettings.get();
    return NextResponse.json({ success: true, settings: s });
  } catch (error) {
    console.error('[Newsletter settings GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const s = await NewsletterSettings.get();
    const b = await request.json();

    if (typeof b.showFounder === 'boolean') s.showFounder = b.showFounder;
    if (typeof b.founderName === 'string') s.founderName = b.founderName;
    if (typeof b.founderCredential === 'string') s.founderCredential = b.founderCredential;
    if (typeof b.founderPhotoUrl === 'string') s.founderPhotoUrl = b.founderPhotoUrl;
    if (typeof b.postalAddress === 'string') s.postalAddress = b.postalAddress;
    if (typeof b.replyToDefault === 'string') s.replyToDefault = b.replyToDefault;
    if (Array.isArray(b.socialLinks)) {
      s.socialLinks = b.socialLinks
        .filter((x) => x && x.url && x.url.trim())
        .map((x) => ({ label: String(x.label || '').trim(), url: String(x.url).trim() }))
        .slice(0, 8);
    }
    await s.save();
    return NextResponse.json({ success: true, settings: s });
  } catch (error) {
    console.error('[Newsletter settings PATCH]', error);
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}
