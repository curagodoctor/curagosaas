/**
 * Practice OS engine — the rules underneath (CLAUDE.md §6).
 *
 * Sequence-paced: the next day opens 24h after the previous is completed, not on
 * a calendar date. Days-completed is monotonic. The Visibility Score never
 * decreases. There is no "behind", no "missed" count, no streak.
 */
import Framework from '@/models/practice-os/Framework';
import Mission from '@/models/practice-os/Mission';
import UserMissionProgress from '@/models/practice-os/UserMissionProgress';
import PracticeOsEnrollment from '@/models/practice-os/PracticeOsEnrollment';
import VisibilityScore, { SCORE_WEIGHTS } from '@/models/practice-os/VisibilityScore';
import KpiEntry from '@/models/practice-os/KpiEntry';
import AiCreditLedger from '@/models/practice-os/AiCreditLedger';
import { resolvePlayableUrl } from '@/lib/gcs';
import { recordCompletion, recordSkip, recordLogin, getOrCreatePerformance } from '@/lib/practice-os/performance';
import { onMissionCompleted, addJourney, getUpcomingAchievement } from '@/lib/practice-os/rewards';

const UNLOCK_DELAY_MS = 24 * 60 * 60 * 1000;

// The active programme framework (first published framework that has days).
export async function resolveProgrammeFramework() {
  const frameworks = await Framework.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
  for (const fw of frameworks) {
    const count = await Mission.countDocuments({ frameworkId: fw._id, status: 'published' });
    if (count > 0) return fw;
  }
  return frameworks[0] || null;
}

export async function getOrCreateEnrollment(doctorId) {
  let enr = await PracticeOsEnrollment.findOne({ doctorId });
  if (!enr) {
    const fw = await resolveProgrammeFramework();
    enr = await PracticeOsEnrollment.create({
      doctorId,
      frameworkId: fw?._id,
      status: 'setup_pending',
    });
  }
  return enr;
}

export async function getOrCreateScore(doctorId) {
  let s = await VisibilityScore.findOne({ doctorId });
  if (!s) s = await VisibilityScore.create({ doctorId });
  return s;
}

/**
 * The doctor's full Practice OS state — the single feed for the Day view.
 */
export async function computeState(doctorId) {
  const enr = await getOrCreateEnrollment(doctorId);
  const [score, days, progresses] = await Promise.all([
    getOrCreateScore(doctorId),
    enr.frameworkId
      ? Mission.find({ frameworkId: enr.frameworkId, status: 'published' })
          .sort({ missionNumber: 1, weekNumber: 1, dayNumber: 1 }).lean()
      : [],
    UserMissionProgress.find({ doctorId }).lean(),
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

  // Daily-login scoring (+2 once/day) and the extra dashboard signals (§6).
  const [perf, ledger, upcoming] = await Promise.all([
    recordLogin(doctorId),
    AiCreditLedger.getOrCreateForToday(doctorId),
    getUpcomingAchievement(doctorId, daysWithStatus),
  ]);

  // Weekly progress — completed vs total in the current week.
  const currentWeek = today?.weekNumber || (daysWithStatus[daysWithStatus.length - 1]?.weekNumber || 1);
  const weekDays = daysWithStatus.filter((d) => d.weekNumber === currentWeek);
  const weekDone = weekDays.filter((d) => d.status === 'completed').length;

  return {
    enrollment: {
      status: enr.status,
      setupComplete: enr.setupComplete,
      daysCompleted: enr.daysCompleted,
      currentDayNumber: enr.currentDayNumber,
      nextUnlockAt: enr.nextUnlockAt,
      startedAt: enr.startedAt,
      intent: enr.intent,
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
    today,
    days: daysWithStatus,
    allComplete,
    daysAway,
  };
}

// Fetch a single day (Mission) for the Focus session / day detail.
export async function getDay(doctorId, missionId) {
  const enr = await getOrCreateEnrollment(doctorId);
  const day = await Mission.findOne({ _id: missionId, frameworkId: enr.frameworkId }).lean();
  if (!day) return null;
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
 * @returns {Promise<{ scoreDelta, component, newTotal, daysCompleted }>}
 */
export async function completeDay(doctorId, missionId, { record, actualMinutes, nextCommitment, reflection, kpis } = {}) {
  const day = await Mission.findById(missionId);
  if (!day) throw new Error('Day not found');
  const enr = await getOrCreateEnrollment(doctorId);
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
        frameworkId: enr.frameworkId,
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
  const score = await getOrCreateScore(doctorId);
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
      await KpiEntry.create({ doctorId, missionId, key: k.key, label: k.label || k.key, value, unit: k.unit || '', recordedAt: now });
      await addJourney(doctorId, { type: 'kpi', title: `${k.label || k.key}: ${value}${k.unit ? ' ' + k.unit : ''}`, missionId });
    }
  }

  // Evidence screenshots -> journey entries (visual history).
  if (!wasCompleted && hasEvidence) {
    for (const url of (record.screenshots || [])) {
      await addJourney(doctorId, { type: 'evidence', title: `Evidence for ${day.category || 'mission'}`, imageUrl: url, missionId });
    }
  }

  // Performance Score (§9,§10) + Achievements/Celebrations (§13) — only once.
  let performance = null;
  let celebration = null;
  if (!wasCompleted) {
    performance = await recordCompletion(doctorId, { onTime, hasEvidence, hasReflection });
    celebration = await onMissionCompleted(doctorId, day, { streak: performance.currentStreak });
  } else {
    performance = await getOrCreatePerformance(doctorId);
  }

  // Advance: monotonic days-completed, 24h sequence-paced unlock.
  if (!wasCompleted) {
    const completedCount = await UserMissionProgress.countDocuments({ doctorId, status: 'completed' });
    enr.daysCompleted = completedCount;
    enr.currentDayNumber = (day.missionNumber || enr.currentDayNumber) + 1;
    enr.nextUnlockAt = new Date(now.getTime() + UNLOCK_DELAY_MS);
    // Flip to 'completed' once every published mission in the programme is done.
    // (There is no `totalDays` field on the enrollment — count live.)
    const totalDays = await Mission.countDocuments({ frameworkId: enr.frameworkId, status: 'published' });
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
  const enr = await getOrCreateEnrollment(doctorId);
  const now = new Date();
  await UserMissionProgress.findOneAndUpdate(
    { doctorId, missionId },
    { $set: { frameworkId: enr.frameworkId, status: 'skipped', completedAt: now }, $setOnInsert: { unlockedAt: now } },
    { upsert: true, setDefaultsOnInsert: true }
  );
  enr.currentDayNumber = (day.missionNumber || enr.currentDayNumber) + 1;
  enr.nextUnlockAt = new Date(now.getTime() + UNLOCK_DELAY_MS);
  enr.lastActiveAt = now;
  await enr.save();
  await recordSkip(doctorId);
  return { ok: true };
}

export { SCORE_WEIGHTS };
