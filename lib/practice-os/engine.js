/**
 * Practice OS engine — the rules underneath (CLAUDE.md §6).
 *
 * Multi-pack: a doctor can own and progress many packs (frameworks) at once.
 * Everything below — enrollment, Visibility Score, Performance Score, journey —
 * is scoped to one (doctor, pack). Sequence-paced: the next day opens 24h after
 * the previous is completed. Days-completed is monotonic per pack.
 */
import Framework from '@/models/practice-os/Framework';
import Mission from '@/models/practice-os/Mission';
import UserMissionProgress from '@/models/practice-os/UserMissionProgress';
import PracticeOsEnrollment from '@/models/practice-os/PracticeOsEnrollment';
import VisibilityScore, { SCORE_WEIGHTS } from '@/models/practice-os/VisibilityScore';
import PerformanceScore from '@/models/practice-os/PerformanceScore';
import KpiEntry from '@/models/practice-os/KpiEntry';
import AiCreditLedger from '@/models/practice-os/AiCreditLedger';
import { resolvePlayableUrl } from '@/lib/gcs';
import { recordCompletion, recordSkip, getOrCreatePerformance } from '@/lib/practice-os/performance';
import { onMissionCompleted, addJourney, getUpcomingAchievement } from '@/lib/practice-os/rewards';
import { hasPackAccess, assertPackAccess } from '@/lib/practice-os/access';
import { getOrCreateProfile } from '@/lib/practice-os/profile';
import { resolveMissionModules, withPlayableModuleVideos } from '@/lib/practice-os/modules';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';
import { fillPlaceholders } from '@/lib/practice-os/template';

const UNLOCK_DELAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Enrollment / score bootstrap (per pack)
// ---------------------------------------------------------------------------

export async function getOrCreateEnrollment(doctorId, frameworkId) {
  if (!frameworkId) throw new Error('getOrCreateEnrollment requires a frameworkId (pack)');
  let enr = await PracticeOsEnrollment.findOne({ doctorId, frameworkId });
  if (!enr) {
    // Setup is global (entered once). If the doctor has already completed it,
    // a newly-bought pack starts immediately instead of asking again.
    const profile = await getOrCreateProfile(doctorId);
    const started = !!profile.setupComplete;
    enr = await PracticeOsEnrollment.create({
      doctorId,
      frameworkId,
      status: started ? 'active' : 'setup_pending',
      setupComplete: started,
      ...(started ? { startedAt: new Date() } : {}),
    });
  }
  return enr;
}

export async function getOrCreateScore(doctorId, frameworkId) {
  let s = await VisibilityScore.findOne({ doctorId, frameworkId });
  if (!s) s = await VisibilityScore.create({ doctorId, frameworkId });
  return s;
}

// ---------------------------------------------------------------------------
// Catalog — all published packs + this doctor's per-pack progress/XP/streak
// ---------------------------------------------------------------------------

// Total XP the doctor has actually earned in a pack = sum of the XP of every
// module they've completed. Falls back to a mission's reward points for a
// mission finished via the quick-finish path where completedModuleIds may be
// implicit. Pure — takes the already-fetched missions + progress docs.
function earnedModuleXp(missions, progresses) {
  const byId = new Map(missions.map((m) => [String(m._id), m]));
  let xp = 0;
  for (const p of progresses) {
    const mission = byId.get(String(p.missionId));
    if (!mission) continue;
    const mods = resolveMissionModules(mission);
    const done = new Set((p.completedModuleIds || []).map(String));
    // If the mission is done but no module ids were tracked, count every module.
    const countAll = done.size === 0;
    let missionXp = 0;
    for (const m of mods) if (countAll || done.has(String(m.id))) missionXp += Number(m.xp) || 0;
    // Legacy missions with no per-module XP still award the mission's reward points.
    if (missionXp === 0) missionXp = Number(mission.reward?.points) || 0;
    xp += missionXp;
  }
  return xp;
}

async function findNextMission(doctorId, frameworkId) {
  const days = await Mission.find({ frameworkId, status: 'published' })
    .sort({ weekNumber: 1, dayNumber: 1, missionNumber: 1, createdAt: 1 })
    .select('missionText category weekNumber dayNumber').lean();
  const prog = await UserMissionProgress.find({ doctorId, frameworkId, status: { $in: ['completed', 'skipped'] } })
    .select('missionId').lean();
  const doneSet = new Set(prog.map((p) => String(p.missionId)));
  const nextIdx = days.findIndex((d) => !doneSet.has(String(d._id)));
  const next = nextIdx === -1 ? null : days[nextIdx];
  // dayNumber = sequential position (stored numbers can be duplicated/missing).
  return next
    ? { id: String(next._id), title: next.missionText, category: next.category, dayNumber: nextIdx + 1, weekNumber: next.weekNumber || Math.floor(nextIdx / 7) + 1 }
    : null;
}

/**
 * The pack catalog for a doctor: every published pack with counts, price,
 * ownership, and — if started — progress, XP, streak, Visibility, and next-up.
 * This is the feed for the pack-selection screen.
 */
export async function listPacksForDoctor(doctorId) {
  const frameworks = await Framework.find({ isActive: true, isPublished: true })
    .sort({ order: 1, createdAt: 1 }).lean();

  const packs = [];
  for (const fw of frameworks) {
    const [missions, owned] = await Promise.all([
      Mission.find({ frameworkId: fw._id, status: 'published' })
        .select('dayNumber modules subSteps inputs buttons title reward')
        .lean(),
      hasPackAccess(doctorId, fw),
    ]);
    // Count modules the way the doctor actually experiences them — the embedded
    // Mission.modules[] (legacy missions synthesize one), NOT the separate Module
    // collection, which can be empty/stale and gave a wrong count on the catalog.
    const missionCount = missions.length;
    const moduleCount = missions.reduce((s, m) => s + resolveMissionModules(m).length, 0);
    const dayNumbers = [...new Set(missions.map((m) => m.dayNumber).filter((n) => n != null))];

    let progress = null, xp = 0, streak = 0, visibility = 0, nextUp = null, started = false;
    let scheduledFor = null, scheduleWindow = '';
    if (owned) {
      const enr = await PracticeOsEnrollment.findOne({ doctorId, frameworkId: fw._id }).lean();
      if (enr) {
        scheduledFor = enr.scheduledFor || null;
        scheduleWindow = enr.scheduleWindow || '';
        const [perf, score, progresses] = await Promise.all([
          PerformanceScore.findOne({ doctorId, frameworkId: fw._id }).lean(),
          VisibilityScore.findOne({ doctorId, frameworkId: fw._id }).lean(),
          UserMissionProgress.find({ doctorId, frameworkId: fw._id, status: { $in: ['completed', 'skipped'] } })
            .select('missionId completedModuleIds').lean(),
        ]);
        const done = progresses.length;
        // XP = the sum of every completed module's own XP across the pack — the
        // number the doctor actually earned (each module advertises +N XP), NOT
        // the 0–100 Performance composite. (#27)
        xp = earnedModuleXp(missions, progresses);
        streak = perf?.currentStreak || 0;
        visibility = score?.total || 0;
        started = (enr.daysCompleted || 0) > 0 || enr.status === 'active' || enr.status === 'completed';
        progress = {
          daysCompleted: enr.daysCompleted || 0,
          done,
          total: missionCount,
          percent: missionCount ? Math.round((done / missionCount) * 100) : 0,
          status: enr.status,
          setupComplete: enr.setupComplete,
        };
        nextUp = await findNextMission(doctorId, fw._id);
      }
    }

    packs.push({
      id: String(fw._id),
      slug: fw.slug,
      title: fw.title,
      tagline: fw.tagline || '',
      summary: fw.summary || fw.description || '',
      category: fw.category || '',
      coverImage: fw.coverImage || '',
      outcomes: fw.outcomes || [],
      priceInInr: fw.priceInInr || 0,
      counts: { missions: missionCount, modules: moduleCount, days: dayNumbers.length || missionCount },
      owned,
      started,
      progress,
      xp,
      streak,
      visibility,
      nextUp,
      scheduledFor,
      scheduleWindow,
    });
  }
  return packs;
}

// ---------------------------------------------------------------------------
// Single-pack state (the Day view feed)
// ---------------------------------------------------------------------------

export async function computeState(doctorId, frameworkId) {
  if (!frameworkId) throw new Error('computeState requires a frameworkId (pack)');
  const framework = await Framework.findById(frameworkId).lean();
  if (!framework) throw new Error('Pack not found');
  await assertPackAccess(doctorId, framework);

  const enr = await getOrCreateEnrollment(doctorId, frameworkId);
  const [profile, score, days, progresses] = await Promise.all([
    getOrCreateProfile(doctorId),
    getOrCreateScore(doctorId, frameworkId),
    Mission.find({ frameworkId, status: 'published' })
      // Curriculum order = week, then day, then mission number, then insertion.
      // (missionNumber alone is unreliable — content can share/duplicate it.)
      .sort({ weekNumber: 1, dayNumber: 1, missionNumber: 1, createdAt: 1 }).lean(),
    UserMissionProgress.find({ doctorId, frameworkId }).lean(),
  ]);

  const progByMission = new Map(progresses.map((p) => [String(p.missionId), p]));
  const now = new Date();

  // Self-heal: a mission whose every module is completed but whose status was
  // reverted (the old `start`-action bug flipped completed → available) is
  // restored to 'completed' so it never re-appears as the current/locked task.
  const heals = [];
  for (const d of days) {
    const p = progByMission.get(String(d._id));
    if (!p || p.status === 'completed' || p.status === 'skipped') continue;
    const done = new Set(p.completedModuleIds || []);
    if (!done.size) continue;
    const modIds = resolveMissionModules(d).map((m) => m.id);
    if (modIds.length && modIds.every((mid) => done.has(mid))) {
      p.status = 'completed';
      p.completedAt = p.completedAt || now;
      heals.push({ _id: p._id, completedAt: p.completedAt });
    }
  }
  if (heals.length) {
    await Promise.all(heals.map((h) =>
      UserMissionProgress.updateOne({ _id: h._id }, { $set: { status: 'completed', completedAt: h.completedAt } })
    ));
    enr.daysCompleted = await UserMissionProgress.countDocuments({ doctorId, frameworkId, status: 'completed' });
    await enr.save();
  }

  // First day that isn't completed/skipped is the "current" day.
  let currentIndex = days.findIndex((d) => {
    const p = progByMission.get(String(d._id));
    return !(p && (p.status === 'completed' || p.status === 'skipped'));
  });
  const allComplete = currentIndex === -1;
  if (allComplete) currentIndex = days.length;

  const daysWithStatus = days.map((d, i) => {
    const p = progByMission.get(String(d._id));
    let status;
    if (p?.status === 'completed') status = 'completed';
    else if (p?.status === 'skipped') status = 'skipped';
    else if (i === currentIndex) {
      const unlocked = p?.manuallyUnlocked || !enr.nextUnlockAt || new Date(enr.nextUnlockAt) <= now;
      status = unlocked ? 'available' : 'locked';
    } else status = 'locked';
    return {
      _id: String(d._id),
      // Sequential position in the curriculum — the source of truth for display,
      // so "Mission N" / "Day N" are always correct even when the stored numbers
      // are duplicated or missing (e.g. every mission saved as missionNumber 1).
      missionNumber: i + 1,
      dayNumber: i + 1,
      // Keep the authored week for grouping + the weekly theme.
      weekNumber: d.weekNumber || Math.floor(i / 7) + 1,
      category: d.category,
      title: d.missionText,
      purpose: d.purpose,
      estimatedMinutes: d.estimatedMinutes,
      scoreComponent: d.scoreComponent,
      points: d.reward?.points || 0,
      status,
      record: p?.record || null,
      completedAt: p?.completedAt || null,
    };
  });

  const today = daysWithStatus[currentIndex] || null;
  const daysAway = enr.lastActiveAt ? Math.floor((now - new Date(enr.lastActiveAt)) / UNLOCK_DELAY_MS) : 0;

  // Performance reflects real task work only — NOT opening the dashboard.
  const [perf, ledger, upcoming] = await Promise.all([
    getOrCreatePerformance(doctorId, frameworkId),
    AiCreditLedger.getOrCreateForToday(doctorId),
    getUpcomingAchievement(doctorId, daysWithStatus),
  ]);

  // Weekly progress — completed vs total in the current week.
  const currentWeek = today?.weekNumber || (daysWithStatus[daysWithStatus.length - 1]?.weekNumber || 1);
  const weekDays = daysWithStatus.filter((d) => d.weekNumber === currentWeek);
  const weekDone = weekDays.filter((d) => d.status === 'completed').length;

  return {
    pack: {
      id: String(framework._id),
      slug: framework.slug,
      title: framework.title,
      tagline: framework.tagline || '',
      category: framework.category || '',
    },
    enrollment: {
      status: enr.status,
      // Setup is global — a doctor who set up any pack is set up for all.
      setupComplete: !!(enr.setupComplete || profile.setupComplete),
      daysCompleted: enr.daysCompleted,
      currentDayNumber: enr.currentDayNumber,
      nextUnlockAt: enr.nextUnlockAt,
      startedAt: enr.startedAt,
      intent: profile.intent,
      totalDays: days.length,
    },
    score: { components: score.components, total: score.total },
    performance: {
      overall: perf.overallScore, execution: perf.executionScore,
      consistency: perf.consistencyScore, learning: perf.learningScore,
      currentStreak: perf.currentStreak, longestStreak: perf.longestStreak,
      missedDays: perf.missedDays, delayedDays: perf.delayedDays,
    },
    aiCredits: { remaining: ledger.dailyBalance, dailyLimit: ledger.dailyLimit },
    weeklyProgress: { week: currentWeek, done: weekDone, total: weekDays.length },
    // Whether the doctor may unlock the next mission early (they can be at most
    // one mission ahead of schedule).
    canAdvance: !enr.aheadUsed,
    upcomingAchievement: upcoming,
    summary: profile.credentials?.summary || '',
    today,
    days: daysWithStatus,
    allComplete,
    daysAway,
  };
}

// Fetch a single day (Mission) for the Focus session / day detail. The pack is
// derived from the mission itself; access is checked against it.
export async function getDay(doctorId, missionId) {
  const day = await Mission.findById(missionId).lean();
  if (!day) return null;
  await assertPackAccess(doctorId, day.frameworkId);
  const enr = await getOrCreateEnrollment(doctorId, day.frameworkId);
  // GCS-hosted videos are stored as gs:// refs (private bucket) — mint short-lived
  // signed read URLs for playback. Non-GCS values (YouTube etc.) pass through.
  day.lectureVideoUrl = await resolvePlayableUrl(day.lectureVideoUrl);
  if (Array.isArray(day.education)) {
    day.education = await Promise.all(
      day.education.map(async (r) => ({ ...r, url: await resolvePlayableUrl(r.url) }))
    );
  }
  // The rich modules the doctor steps through in the workspace (legacy missions
  // synthesize a single default module).
  const modules = await withPlayableModuleVideos(resolveMissionModules(day));
  // Inject the doctor's stored variables (gbp_link, website_url, …) into the
  // ready-to-copy prompt so they paste their real values without switching screens.
  const fields = await getDoctorProfileFields(doctorId);
  for (const m of modules) {
    m.aiPromptRaw = m.aiPrompt;
    m.aiPrompt = fillPlaceholders(m.aiPrompt, fields);
    // Placeholders can appear anywhere the doctor reads, not just the AI prompt —
    // fill the step-by-step instructions, lecture and outcome copy too so their
    // real values (Google link, website, etc.) show inline. (#30)
    if (Array.isArray(m.steps)) m.steps = m.steps.map((s) => fillPlaceholders(s, fields));
    if (m.lecture) m.lecture = fillPlaceholders(m.lecture, fields);
    if (m.expectedOutcome) m.expectedOutcome = fillPlaceholders(m.expectedOutcome, fields);
    if (m.prerequisites) m.prerequisites = fillPlaceholders(m.prerequisites, fields);
    if (Array.isArray(m.inputs)) {
      m.inputs = m.inputs.map((f) => ({ ...f, placeholder: fillPlaceholders(f.placeholder, fields) }));
    }
  }
  const progress = await UserMissionProgress.findOne({ doctorId, missionId }).lean();
  return { day, modules, progress, enrollment: enr };
}

/**
 * Save the live cross-device draft for an in-progress Focus session (unsaved
 * inputs, ticked steps, module position, timer). Stored on UserMissionProgress so
 * the same mission looks identical on any device. No-op once the mission is done.
 */
export async function saveMissionDraft(doctorId, missionId, draft = {}) {
  const mission = await Mission.findById(missionId).select('frameworkId').lean();
  if (!mission) throw new Error('Mission not found');
  await assertPackAccess(doctorId, mission.frameworkId);
  const existing = await UserMissionProgress.findOne({ doctorId, missionId }).select('status').lean();
  if (existing?.status === 'completed' || existing?.status === 'skipped') return { skipped: true };
  const now = new Date();
  const clean = {
    inputVals: draft.inputVals ?? null,
    stepChecks: draft.stepChecks ?? null,
    reflection: draft.reflection ?? null,
    kpiValues: draft.kpiValues ?? null,
    index: Number.isFinite(draft.index) ? draft.index : 0,
    remaining: Number.isFinite(draft.remaining) ? draft.remaining : null,
    running: !!draft.running,
    timerUpdatedAt: now,
    updatedAt: now,
  };
  await UserMissionProgress.findOneAndUpdate(
    { doctorId, missionId },
    { $set: { frameworkId: mission.frameworkId, draft: clean }, $setOnInsert: { unlockedAt: now, startedAt: now } },
    { upsert: true, setDefaultsOnInsert: true }
  );
  return { ok: true };
}

/**
 * Complete ONE module within a mission. Records the module's evidence inputs and
 * marks it done. When every module in the mission is done, the mission itself is
 * finalized (score, celebration, unlock advance) via completeDay.
 * @returns {Promise<{ missionComplete, completedModuleIds, nextModuleId, completion? }>}
 */
export async function completeModule(doctorId, missionId, moduleId, { inputs, actualMinutes, kpis, reflection } = {}) {
  const mission = await Mission.findById(missionId).lean();
  if (!mission) throw new Error('Mission not found');
  await assertPackAccess(doctorId, mission.frameworkId);
  const enr = await getOrCreateEnrollment(doctorId, mission.frameworkId);

  const modules = resolveMissionModules(mission);
  const allIds = modules.map((m) => m.id);
  const id = String(moduleId);
  if (!allIds.includes(id)) throw new Error('Module not found');

  const existing = await UserMissionProgress.findOne({ doctorId, missionId });
  const already = new Set(existing?.completedModuleIds || []);
  already.add(id);
  const completedModuleIds = allIds.filter((mid) => already.has(mid)); // keep order, dedupe

  // Inputs arrive keyed by input id. Map to { label: value } for the readable
  // record, and persist any declared variables (gbp_link, …) doctor-globally so
  // they can be injected into later prompts/content.
  const currentDef = modules.find((m) => m.id === id);
  const labelled = {};
  if (inputs && typeof inputs === 'object' && currentDef) {
    const profile = await getOrCreateProfile(doctorId);
    profile.variables = profile.variables || {};
    let varsChanged = false;
    for (const f of currentDef.inputs || []) {
      const v = inputs[f.id];
      if (v == null || String(v).trim() === '') continue;
      labelled[f.label] = String(v).trim();
      if (f.variable) { profile.variables[f.variable] = String(v).trim(); varsChanged = true; }
    }
    if (varsChanged) { profile.markModified('variables'); await profile.save(); }
  }
  const moduleInputs = { ...(existing?.moduleInputs || {}) };
  if (Object.keys(labelled).length) moduleInputs[id] = labelled;

  await UserMissionProgress.findOneAndUpdate(
    { doctorId, missionId },
    {
      $set: { frameworkId: mission.frameworkId, completedModuleIds, moduleInputs,
        ...(existing?.status === 'completed' ? {} : { status: 'available' }) },
      $setOnInsert: { unlockedAt: new Date(), startedAt: new Date() },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  const allDone = allIds.every((mid) => already.has(mid));
  if (allDone && existing?.status !== 'completed') {
    // Roll the per-module inputs up into the mission record + finalize.
    const links = [];
    const noteParts = [];
    for (const m of modules) {
      const vals = moduleInputs[m.id] || {};
      for (const [k, v] of Object.entries(vals)) {
        const val = String(v || '').trim();
        if (!val) continue;
        if (/^https?:\/\//i.test(val)) links.push(val); else noteParts.push(`${k}: ${val}`);
      }
    }
    const completion = await completeDay(doctorId, missionId, {
      record: { links, notes: noteParts.join('\n'), screenshots: [] },
      actualMinutes, kpis, reflection,
    });
    return { missionComplete: true, completedModuleIds, nextModuleId: null, completion };
  }

  const nextModuleId = allIds.find((mid) => !already.has(mid)) || null;
  return { missionComplete: false, completedModuleIds, nextModuleId };
}

/**
 * Complete a day: save the record, update the score, advance the unlock clock.
 * The pack is derived from the mission. @returns completion summary.
 */
export async function completeDay(doctorId, missionId, { record, actualMinutes, nextCommitment, reflection, kpis } = {}) {
  const day = await Mission.findById(missionId);
  if (!day) throw new Error('Day not found');
  const frameworkId = day.frameworkId;
  await assertPackAccess(doctorId, frameworkId);
  const enr = await getOrCreateEnrollment(doctorId, frameworkId);
  const now = new Date();
  // Finishing the mission marks every module done (keeps the quick-finish path
  // and the module-by-module path consistent).
  const allModuleIds = resolveMissionModules(day).map((m) => m.id);

  const existing = await UserMissionProgress.findOne({ doctorId, missionId });
  const wasCompleted = existing?.status === 'completed';

  const hasEvidence = !!(record && ((record.screenshots || []).length || (record.links || []).length));
  const hasReflection = !!(reflection && (reflection.confidence || reflection.learning || reflection.challenge));
  // On-time = finished within 24h of the mission becoming available.
  const availableAt = existing?.unlockedAt || existing?.startedAt || enr.nextUnlockAt || now;
  const onTime = now.getTime() - new Date(availableAt).getTime() <= UNLOCK_DELAY_MS;

  await UserMissionProgress.findOneAndUpdate(
    { doctorId, missionId },
    {
      $set: {
        frameworkId,
        status: 'completed',
        completedAt: now,
        completedModuleIds: allModuleIds,
        actualMinutes: actualMinutes || existing?.actualMinutes || 0,
        draft: null,   // in-progress draft no longer applies once complete
        ...(record ? { record } : {}),
        ...(reflection ? { reflection } : {}),
        ...(nextCommitment ? { nextCommitment } : {}),
      },
      $setOnInsert: { unlockedAt: now },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Visibility Score — add this day's points to its component (only once).
  let scoreDelta = 0;
  const component = day.scoreComponent && day.scoreComponent !== 'none' ? day.scoreComponent : null;
  const score = await getOrCreateScore(doctorId, frameworkId);
  if (!wasCompleted && component) {
    const before = score.total;
    score.components[component] = (score.components[component] || 0) + (day.reward?.points || 0);
    score.recompute();
    scoreDelta = score.total - before;
    score.history.push({ date: now, total: score.total });
    await score.save();
  }

  // KPI datapoints (§11) — record each metric the doctor entered.
  if (Array.isArray(kpis)) {
    for (const k of kpis) {
      if (!k || !k.key || k.value === '' || k.value === null || k.value === undefined) continue;
      const value = Number(k.value);
      if (!Number.isFinite(value)) continue;
      await KpiEntry.create({ doctorId, missionId, frameworkId, key: k.key, label: k.label || k.key, value, unit: k.unit || '', recordedAt: now });
      await addJourney(doctorId, { type: 'kpi', title: `${k.label || k.key}: ${value}${k.unit ? ' ' + k.unit : ''}`, missionId, frameworkId });
    }
  }

  // Evidence screenshots -> journey entries (visual history).
  if (!wasCompleted && hasEvidence) {
    for (const url of (record.screenshots || [])) {
      await addJourney(doctorId, { type: 'evidence', title: `Evidence for ${day.category || 'mission'}`, imageUrl: url, missionId, frameworkId });
    }
  }

  // Performance Score (§9,§10) + Achievements/Celebrations (§13) — only once.
  let performance = null;
  let celebration = null;
  if (!wasCompleted) {
    performance = await recordCompletion(doctorId, frameworkId, { onTime, hasEvidence, hasReflection });
    celebration = await onMissionCompleted(doctorId, day, { streak: performance.currentStreak });
  } else {
    performance = await getOrCreatePerformance(doctorId, frameworkId);
  }

  // Advance: monotonic days-completed, 24h sequence-paced unlock.
  if (!wasCompleted) {
    const completedCount = await UserMissionProgress.countDocuments({ doctorId, frameworkId, status: 'completed' });
    enr.daysCompleted = completedCount;
    enr.currentDayNumber = (day.missionNumber || enr.currentDayNumber) + 1;
    enr.nextUnlockAt = new Date(now.getTime() + UNLOCK_DELAY_MS);
    // One-day-ahead rule: if this mission was unlocked early (worked ahead), the
    // doctor has used their advance and can't jump the next one; completing a
    // mission on-schedule resets it.
    enr.aheadUsed = !!existing?.manuallyUnlocked;
    // Flip to 'completed' once every published mission in the pack is done.
    const totalDays = await Mission.countDocuments({ frameworkId, status: 'published' });
    if (enr.status === 'active' && totalDays > 0 && completedCount >= totalDays) enr.status = 'completed';
  }
  enr.lastActiveAt = now;
  await enr.save();

  return {
    scoreDelta, component, newTotal: score.total, daysCompleted: enr.daysCompleted,
    onTime, celebration,
    performance: performance && {
      overall: performance.overallScore, execution: performance.executionScore,
      consistency: performance.consistencyScore, learning: performance.learningScore,
      currentStreak: performance.currentStreak, longestStreak: performance.longestStreak,
    },
  };
}

/**
 * Set the doctor's schedule for their next task in a pack. Constrained to same
 * day up to 2 days out (0, 1 or 2). The pack is derived from the mission.
 */
export async function setNextSchedule(doctorId, missionId, { dayOffset = 1, window = '', exactTime = '' } = {}) {
  const mission = await Mission.findById(missionId).lean();
  if (!mission) throw new Error('Mission not found');
  await assertPackAccess(doctorId, mission.frameworkId);
  const enr = await getOrCreateEnrollment(doctorId, mission.frameworkId);

  const offset = Math.min(2, Math.max(0, Number(dayOffset) || 0)); // clamp 0–2 days
  const when = new Date();
  when.setDate(when.getDate() + offset);
  const times = { morning: '09:00', afternoon: '14:00', evening: '19:30', night: '21:30' };
  const [h, m] = (exactTime || times[window] || '19:30').split(':');
  when.setHours(Number(h) || 19, Number(m) || 30, 0, 0);

  enr.scheduledFor = when;
  enr.scheduleWindow = window || '';
  enr.scheduleExactTime = exactTime || '';
  await enr.save();
  return { scheduledFor: when };
}

// Skip a day — it still completes (no penalty), no score, advances the clock.
export async function skipDay(doctorId, missionId) {
  const day = await Mission.findById(missionId);
  if (!day) throw new Error('Day not found');
  const frameworkId = day.frameworkId;
  await assertPackAccess(doctorId, frameworkId);
  const enr = await getOrCreateEnrollment(doctorId, frameworkId);
  const now = new Date();
  await UserMissionProgress.findOneAndUpdate(
    { doctorId, missionId },
    { $set: { frameworkId, status: 'skipped', completedAt: now }, $setOnInsert: { unlockedAt: now } },
    { upsert: true, setDefaultsOnInsert: true }
  );
  enr.currentDayNumber = (day.missionNumber || enr.currentDayNumber) + 1;
  enr.nextUnlockAt = new Date(now.getTime() + UNLOCK_DELAY_MS);
  enr.lastActiveAt = now;
  await enr.save();
  await recordSkip(doctorId, frameworkId);
  return { ok: true };
}

export { SCORE_WEIGHTS };
