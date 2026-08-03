/**
 * Practice OS — Performance Score engine (PRD §9, §10).
 *
 * Event-driven execution scoring. Points are added/subtracted as events happen
 * (completion, skip, daily login, effective AI use) and bucketed into three
 * displayed scores plus an overall:
 *   Execution   — completing missions (on-time +10 / late +7, skip −5)
 *   Consistency — streaks + daily login (+2/day)
 *   Learning    — evidence (+5), reflection (+2), AI used (+2/day)
 * Overall = Execution + Consistency + Learning (floored at 0 for display).
 */
import PerformanceScore from '@/models/practice-os/PerformanceScore';

function startOfDay(d = new Date()) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function recomputeOverall(p) {
  p.overallScore = Math.max(0, p.executionScore + p.consistencyScore + p.learningScore);
}

export async function getOrCreatePerformance(doctorId, frameworkId) {
  let p = await PerformanceScore.findOne({ doctorId, frameworkId });
  if (!p) p = await PerformanceScore.create({ doctorId, frameworkId });
  return p;
}

// A completed mission. onTime = finished within 24h of becoming available.
export async function recordCompletion(doctorId, frameworkId, { onTime = true, hasEvidence = false, hasReflection = false } = {}) {
  const p = await getOrCreatePerformance(doctorId, frameworkId);
  if (onTime) {
    p.executionScore += 10;
  } else {
    p.executionScore += 7;        // late completion (net −3 vs on-time)
    p.delayedDays += 1;
  }
  if (hasEvidence) p.learningScore += 5;
  if (hasReflection) p.learningScore += 2;

  p.currentStreak += 1;
  if (p.currentStreak > p.longestStreak) p.longestStreak = p.currentStreak;
  p.consistencyScore += 2;        // streak reward per completed mission

  p.lastActivityDate = new Date();
  recomputeOverall(p);
  await p.save();
  return p;
}

// A skipped mission — penalise and break the streak.
export async function recordSkip(doctorId, frameworkId) {
  const p = await getOrCreatePerformance(doctorId, frameworkId);
  p.executionScore = Math.max(0, p.executionScore - 5);
  p.missedDays += 1;
  p.currentStreak = 0;
  p.lastActivityDate = new Date();
  recomputeOverall(p);
  await p.save();
  return p;
}

// +2 once per day for showing up (scoped to the pack the doctor opened).
export async function recordLogin(doctorId, frameworkId) {
  const p = await getOrCreatePerformance(doctorId, frameworkId);
  const today = startOfDay();
  if (!p.lastLoginScoredDate || p.lastLoginScoredDate < today) {
    p.consistencyScore += 2;
    p.lastLoginScoredDate = today;
    recomputeOverall(p);
    await p.save();
  }
  return p;
}

// +2 once per day for using the assistant effectively (scoped to the pack).
export async function recordAiUse(doctorId, frameworkId) {
  const p = await getOrCreatePerformance(doctorId, frameworkId);
  const today = startOfDay();
  if (!p.lastAiScoredDate || p.lastAiScoredDate < today) {
    p.learningScore += 2;
    p.lastAiScoredDate = today;
    recomputeOverall(p);
    await p.save();
  }
  return p;
}
