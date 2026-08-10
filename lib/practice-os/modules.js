/**
 * Practice OS — module resolution.
 *
 * A mission (day) is completed by stepping through its `modules[]`. Missions
 * authored before modules existed have none, so we synthesize ONE default module
 * from the legacy mission-level fields. This keeps old content working with no DB
 * migration while new content uses real modules.
 */
import { resolvePlayableUrl } from '@/lib/gcs';

// Normalize a mission's modules into a stable, ordered array (ids as strings).
export function resolveMissionModules(mission) {
  const list = Array.isArray(mission?.modules) ? mission.modules : [];
  if (list.length) {
    return list
      .map((m, i) => ({
        id: String(m._id || `m${i}`),
        title: m.title || `Module ${i + 1}`,
        order: m.order ?? i,
        xp: m.xp ?? 0,
        videoUrl: m.videoUrl || '',
        expectedOutcome: m.expectedOutcome || '',
        prerequisites: m.prerequisites || '',
        lecture: m.lecture || '',
        education: Array.isArray(m.education) ? m.education.map((e) => ({ type: e.type || 'link', label: e.label || 'Resource', url: e.url || '' })) : [],
        steps: Array.isArray(m.steps) ? m.steps : [],
        aiPrompt: m.aiPrompt || '',
        aiSystemPrompt: m.aiSystemPrompt || '',
        buttons: Array.isArray(m.buttons) ? m.buttons.map((b) => ({ label: b.label, url: b.url || '' })) : [],
        inputs: Array.isArray(m.inputs) ? m.inputs.map((f) => ({ id: String(f._id || f.label), label: f.label, placeholder: f.placeholder || '', required: !!f.required, variable: f.variable || '' })) : [],
      }))
      .sort((a, b) => a.order - b.order);
  }
  // Legacy single default module synthesized from mission-level fields.
  return [{
    id: 'default',
    title: mission?.missionText || mission?.objective || mission?.category || 'Complete this mission',
    order: 0,
    xp: mission?.reward?.points || 0,
    videoUrl: mission?.lectureVideoUrl || '',
    expectedOutcome: mission?.expectedOutcome || '',
    prerequisites: mission?.prerequisites || '',
    lecture: mission?.lecture || mission?.briefDescription || '',
    education: Array.isArray(mission?.education) ? mission.education.map((e) => ({ type: e.type || 'link', label: e.label || 'Resource', url: e.url || '' })) : [],
    steps: Array.isArray(mission?.subSteps) ? mission.subSteps : [],
    aiPrompt: '',
    aiSystemPrompt: mission?.aiContext?.systemPrompt || '',
    buttons: Array.isArray(mission?.buttons) ? mission.buttons.map((b) => ({ label: b.label, url: b.url || '' })) : [],
    inputs: Array.isArray(mission?.inputs) ? mission.inputs.map((f, i) => ({ id: String(f._id || `in${i}`), label: f.label, placeholder: '', required: !!f.required, variable: f.variable || '' })) : [],
  }];
}

// Resolve gs:// video refs to signed playback URLs for a resolved module list.
export async function withPlayableModuleVideos(modules) {
  return Promise.all(modules.map(async (m) => ({
    ...m,
    videoUrl: await resolvePlayableUrl(m.videoUrl),
    hasVideo: !!m.videoUrl,
  })));
}

// Find the module the assistant/workspace is currently on.
export function findModule(modules, moduleId) {
  return modules.find((m) => m.id === String(moduleId)) || null;
}
