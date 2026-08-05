import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAdminFromCookie, requirePlatformAdmin } from '@/lib/platformAdminAuth';
import Mission from '@/models/practice-os/Mission';

// GET /api/platform/practice-os/missions/[id]
export async function GET(request, { params }) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const { id } = await params;
    const mission = await Mission.findById(id).lean();
    if (!mission) return NextResponse.json({ success: false, error: 'Mission not found' }, { status: 404 });
    return NextResponse.json({ success: true, mission });
  } catch (error) {
    console.error('[Practice OS Mission GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load mission' }, { status: 500 });
  }
}

// Fields an admin may edit on a mission.
const EDITABLE = [
  'weekNumber', 'dayNumber', 'missionNumber', 'category', 'purpose', 'missionText',
  'subSteps', 'scoreComponent', 'estimatedMinutes', 'lecture', 'lectureVideoUrl',
  'education', 'buttons', 'aiContext', 'evidence', 'reflection', 'reward',
  'kpiFields', 'completionRules', 'unlockDelayDays', 'isActive', 'status', 'modules',
];

// Accept either an array of strings or a newline-joined string; return trimmed,
// non-empty strings.
function toStringArray(value) {
  const arr = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split('\n')
      : [];
  return arr.map((s) => (typeof s === 'string' ? s.trim() : String(s ?? '').trim())).filter(Boolean);
}

// Coerce the incoming `modules` array to the ModuleSchema shape. Preserves `_id`
// on existing modules so edits update in place rather than duplicating.
function sanitizeModules(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((mod, i) => {
      if (!mod || typeof mod !== 'object') return null;
      const title = typeof mod.title === 'string' ? mod.title.trim() : '';
      if (!title) return null;

      const buttons = Array.isArray(mod.buttons)
        ? mod.buttons
            .map((b) => ({
              label: typeof b?.label === 'string' ? b.label.trim() : '',
              url: typeof b?.url === 'string' ? b.url.trim() : '',
            }))
            .filter((b) => b.label)
        : [];

      const inputs = Array.isArray(mod.inputs)
        ? mod.inputs
            .map((inp) => ({
              label: typeof inp?.label === 'string' ? inp.label.trim() : '',
              placeholder: typeof inp?.placeholder === 'string' ? inp.placeholder.trim() : '',
              required: Boolean(inp?.required),
              variable: String(inp?.variable || '').trim(),
            }))
            .filter((inp) => inp.label)
        : [];

      const out = {
        title,
        order: Number.isFinite(Number(mod.order)) ? Number(mod.order) : i,
        xp: Number.isFinite(Number(mod.xp)) ? Number(mod.xp) : 40,
        videoUrl: typeof mod.videoUrl === 'string' ? mod.videoUrl.trim() : '',
        expectedOutcome: typeof mod.expectedOutcome === 'string' ? mod.expectedOutcome.trim() : '',
        prerequisites: typeof mod.prerequisites === 'string' ? mod.prerequisites.trim() : '',
        steps: toStringArray(mod.steps),
        aiPrompt: typeof mod.aiPrompt === 'string' ? mod.aiPrompt.trim() : '',
        aiSystemPrompt: typeof mod.aiSystemPrompt === 'string' ? mod.aiSystemPrompt.trim() : '',
        buttons,
        inputs,
      };
      // Keep the existing sub-document id so Mongoose updates in place.
      if (mod._id) out._id = mod._id;
      return out;
    })
    .filter(Boolean);
}

// PATCH /api/platform/practice-os/missions/[id]
export async function PATCH(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const update = {};
    for (const key of EDITABLE) {
      if (key in body) update[key] = body[key];
    }
    if ('modules' in update) update.modules = sanitizeModules(update.modules);

    const mission = await Mission.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
    if (!mission) return NextResponse.json({ success: false, error: 'Mission not found' }, { status: 404 });
    return NextResponse.json({ success: true, mission });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Practice OS Mission PATCH]', error);
    return NextResponse.json({ success: false, error: 'Failed to update mission' }, { status: 500 });
  }
}

// DELETE /api/platform/practice-os/missions/[id]
export async function DELETE(request, { params }) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const { id } = await params;
    await Mission.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Practice OS Mission DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete mission' }, { status: 500 });
  }
}
