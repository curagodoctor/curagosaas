/**
 * Practice OS engine — the rules underneath (CLAUDE.md §6).
 *
 * Multi-pack: a doctor can own and progress many packs (frameworks) at once.
 * Everything below — enrollment, Visibility Score, Performance Score, journey —
 * is scoped to one (doctor, pack). Sequence-paced: the next day opens 24h after
 * the previous is completed. Days-completed is monotonic per pack.
 */
import Framework from '@/models/practice-os/Framework';
import Module from '@/models/practice-os/Module';
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

async function findNextMission(doctorId, frameworkId) {
  const days = await Mission.find({ frameworkId, status: 'published' })
    .sort({ missionNumber: 1, weekNumber: 1, dayNumber: 1 })
    .select('missionText category weekNumber dayNumber').lean();
  const prog = await UserMissionProgress.find({ doctorId, frameworkId, status: { $in: ['completed', 'skipped'] } })
    .select('missionId').lean();
  const doneSet = new Set(prog.map((p) => String(p.missionId)));
  const next = days.find((d) => !doneSet.has(String(d._id)));
  return next
    ? { id: String(next._id), title: next.missionText, category: next.category, dayNumber: next.dayNumber, weekNumber: next.weekNumber }
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
    const [missionCount, moduleCount, dayNumbers, owned] = await Promise.all([
      Mission.countDocuments({ frameworkId: fw._id, status: 'published' }),
      Module.countDocuments({ frameworkId: fw._id, isActive: true }),
      Mission.distinct('dayNumber', { frameworkId: fw._id, status: 'published' }),
      hasPackAccess(doctorId, fw),
    ]);

    let progress = null, xp = 0, streak = 0, visibility = 0, nextUp = null, started = false;
    if (owned) {
      const enr = await PracticeOsEnrollment.findOne({ doctorId, frameworkId: fw._id }).lean();
      if (enr) {
        const [perf, score, done] = await Promise.all([
          PerformanceScore.findOne({ doctorId, frameworkId: fw._id }).lean(),
          VisibilityScore.findOne({ doctorId, frameworkId: fw._id }).lean(),
          UserMissionProgress.countDocuments({ doctorId, frameworkId: fw._id, status: { $in: ['completed', 'skipped'] } }),
        ]);
        xp = perf?.overallScore || 0;
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
      .sort({ missionNumber: 1, weekNumber: 1, dayNumber: 1 }).lean(),
    UserMissionProgress.find({ doctorId, frameworkId }).lean(),
  ]);

  const progByMission = new Map(progresses.map((p) => [String(p.missionId), p]));
  const now = new Date();

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
      missionNumber: d.missionNumber,
      weekNumber: d.weekNumber,
      dayNumber: d.dayNumber,
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
  const progress = await UserMissionProgress.findOne({ doctorId, missionId }).lean();
  return { day, progress, enrollment: enr };
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
        actualMinutes: actualMinutes || existing?.actualMinutes || 0,
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
