import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAdminFromCookie, requirePlatformAdmin } from '@/lib/platformAdminAuth';
import ProfileFieldConfig from '@/models/practice-os/ProfileFieldConfig';
import { DEFAULT_SECTIONS, mergeProfileSections } from '@/lib/practice-os/profile-fields-defaults';

export const runtime = 'nodejs';

// GET — the admin view: the built-in defaults, the saved configs, and the merged
// effective sections (so the UI can show what the doctor will actually see). (#39)
export async function GET() {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const configs = await ProfileFieldConfig.find().sort({ createdAt: 1 }).lean();
    return NextResponse.json({
      success: true,
      defaults: DEFAULT_SECTIONS,
      configs,
      merged: mergeProfileSections(configs),
    });
  } catch (error) {
    console.error('[Profile fields GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load' }, { status: 500 });
  }
}

const snake = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

// POST — create/update a field config, keyed by `key` (upsert). (#39)
export async function POST(request) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const body = await request.json();
    const key = snake(body.key);
    if (!key) return NextResponse.json({ success: false, error: 'A field key is required' }, { status: 400 });

    const options = Array.isArray(body.options)
      ? body.options.map((o) => String(o).trim()).filter(Boolean)
      : String(body.options || '').split(/[\n,]/).map((o) => o.trim()).filter(Boolean);

    const update = {
      key,
      label: body.label || '',
      hint: body.hint || '',
      type: ['text', 'textarea', 'number', 'select', 'tags'].includes(body.type) ? body.type : 'text',
      options,
      required: !!body.required,
      section: ['pro', 'practice', 'voice'].includes(body.section) ? body.section : 'pro',
      order: body.order != null && body.order !== '' ? Number(body.order) : null,
      hidden: !!body.hidden,
    };
    const config = await ProfileFieldConfig.findOneAndUpdate({ key }, { $set: update }, { new: true, upsert: true, setDefaultsOnInsert: true });
    return NextResponse.json({ success: true, config });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Profile fields POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to save field' }, { status: 500 });
  }
}

// DELETE ?key=... — remove a config (a custom field disappears; an override
// reverts the default field to built-in). (#39)
export async function DELETE(request) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const key = new URL(request.url).searchParams.get('key');
    if (!key) return NextResponse.json({ success: false, error: 'key required' }, { status: 400 });
    await ProfileFieldConfig.deleteOne({ key });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Profile fields DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
  }
}
