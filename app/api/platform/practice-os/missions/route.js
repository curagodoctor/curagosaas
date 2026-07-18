import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAdminFromCookie, requirePlatformAdmin } from '@/lib/platformAdminAuth';
import Framework from '@/models/practice-os/Framework';
import Module from '@/models/practice-os/Module';
import Mission from '@/models/practice-os/Mission';
import { slugify, parseKpiFields, buildEducation } from '@/lib/practice-os/import-helpers';

// GET /api/platform/practice-os/missions — flat list (optionally by framework).
export async function GET(request) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const { searchParams } = new URL(request.url);
    const q = {};
    if (searchParams.get('frameworkId')) q.frameworkId = searchParams.get('frameworkId');

    const missions = await Mission.find(q).sort({ missionNumber: 1 }).lean();
    return NextResponse.json({ success: true, missions });
  } catch (error) {
    console.error('[Practice OS Missions GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load missions' }, { status: 500 });
  }
}

// POST /api/platform/practice-os/missions — manually create a mission. Resolves
// (or creates) the framework + module by name, mirroring the bulk importer.
export async function POST(request) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const b = await request.json();
    const frameworkTitle = (b.framework || '').trim();
    const moduleTitle = (b.module || b.moduleName || '').trim();
    const missionText = (b.missionText || '').trim();
    const missionNumber = Number(b.missionNumber);

    if (!frameworkTitle || !moduleTitle || !missionText) {
      return NextResponse.json({ success: false, error: 'Framework, Module and Mission text are required.' }, { status: 400 });
    }
    if (!Number.isFinite(missionNumber)) {
      return NextResponse.json({ success: false, error: 'Mission Number must be a number.' }, { status: 400 });
    }

    // Upsert framework + module by name.
    const framework = await Framework.findOneAndUpdate(
      { slug: slugify(frameworkTitle) },
      { $setOnInsert: { title: frameworkTitle, slug: slugify(frameworkTitle) } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const mod = await Module.findOneAndUpdate(
      { frameworkId: framework._id, title: moduleTitle },
      { $setOnInsert: { frameworkId: framework._id, title: moduleTitle } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Normalize evidence: accept either an evidence object or a single type.
    let evidence = { required: false, allowedTypes: ['image', 'url', 'text'] };
    if (b.evidence && typeof b.evidence === 'object') {
      evidence = b.evidence;
    } else if (b.evidenceRequired && b.evidenceRequired !== 'none') {
      evidence = { required: true, allowedTypes: [b.evidenceRequired] };
    }

    const doc = {
      frameworkId: framework._id,
      moduleId: mod._id,
      weekNumber: Number(b.weekNumber ?? b.week) || 1,
      dayNumber: Number(b.dayNumber ?? b.day) || 1,
      missionNumber,
      category: b.category || '',
      purpose: b.purpose || '',
      missionText,
      education: Array.isArray(b.education) ? b.education : buildEducation({ videoUrl: b.videoUrl, pdfUrl: b.pdfUrl, externalLink: b.externalLink }),
      buttons: Array.isArray(b.buttons) ? b.buttons.filter((x) => x && x.label) : [],
      aiContext: { systemPrompt: b.gptPrompt || b.aiContext?.systemPrompt || '', model: '' },
      evidence,
      reward: {
        points: Number(b.rewardPoints ?? b.reward?.points) || 10,
        badge: b.reward?.badge || '',
        message: b.celebrationMessage || b.reward?.message || '',
      },
      kpiFields: Array.isArray(b.kpiFields)
        ? b.kpiFields.map((k) => (typeof k === 'string' ? { key: slugify(k), label: k, unit: '' } : k))
        : parseKpiFields(b.kpiFields || ''),
      unlockDelayDays: Number(b.unlockDelayDays ?? b.unlockDelay) || 1,
      status: 'published',
      isActive: true,
    };

    const key = {
      frameworkId: framework._id,
      moduleId: mod._id,
      weekNumber: doc.weekNumber,
      dayNumber: doc.dayNumber,
      missionNumber: doc.missionNumber,
    };
    await Mission.updateOne(key, { $set: doc }, { upsert: true });
    const mission = await Mission.findOne(key).lean();

    return NextResponse.json({ success: true, mission, frameworkId: framework._id });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Practice OS Missions POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to create mission' }, { status: 500 });
  }
}
