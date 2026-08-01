/**
 * Practice OS — Rewards + Journey (PRD §13, §18).
 *
 * Awards Achievements (mission / weekly / monthly / framework / streak) and
 * appends JourneyTimeline entries. Celebration detection tells the Focus session
 * what to celebrate on completion.
 */
import Mission from '@/models/practice-os/Mission';
import UserMissionProgress from '@/models/practice-os/UserMissionProgress';
import Achievement from '@/models/practice-os/Achievement';
import JourneyTimeline from '@/models/practice-os/JourneyTimeline';

export async function awardAchievement(doctorId, data) {
  const a = await Achievement.create({ doctorId, ...data });
  // Mirror every achievement onto the journey timeline.
  await addJourney(doctorId, {
    type: 'achievement',
    title: data.title,
    description: data.message || '',
    missionId: data.missionId,
  });
  return a;
}

export async function addJourney(doctorId, entry) {
  return JourneyTimeline.create({ doctorId, ...entry });
}

/**
 * Called after a mission is completed. Awards the mission achievement, records
 * the journey entry, and detects week/framework completion for bigger
 * celebrations. Returns the single highest-tier celebration to show (or null).
 */
export async function onMissionCompleted(doctorId, mission, { streak = 0 } = {}) {
  const celebrations = [];

  // 1) Mission-level (always)
  const missionAch = {
    type: 'mission',
    title: mission.reward?.badge || 'Mission complete',
    message: mission.reward?.message || 'One more step toward a findable practice.',
    badge: mission.reward?.badge || '',
    xp: mission.reward?.points || 0,
    missionId: mission._id,
  };
  await awardAchievement(doctorId, missionAch);
  await addJourney(doctorId, {
    type: 'mission_completed',
    title: mission.missionText || mission.category || 'Mission completed',
    description: mission.category || '',
    missionId: mission._id,
  });
  celebrations.push({ tier: 1, ...missionAch });

  // 2) Streak milestones (every 7)
  if (streak > 0 && streak % 7 === 0) {
    const streakAch = { type: 'streak', title: `${streak}-mission streak`, message: `You've kept going ${streak} missions in a row.`, xp: 0 };
    await awardAchievement(doctorId, streakAch);
    celebrations.push({ tier: 2, ...streakAch });
  }

  // 3) Week completion — all published missions in this weekNumber are done.
  if (mission.weekNumber) {
    const weekMissions = await Mission.find({ frameworkId: mission.frameworkId, weekNumber: mission.weekNumber, status: 'published' }).select('_id').lean();
    if (weekMissions.length > 0) {
      const ids = weekMissions.map((m) => m._id);
      const doneCount = await UserMissionProgress.countDocuments({ doctorId, missionId: { $in: ids }, status: { $in: ['completed', 'skipped'] } });
      if (doneCount >= weekMissions.length) {
        const weekAch = { type: 'weekly', title: `Week ${mission.weekNumber} complete`, message: `You finished every mission in week ${mission.weekNumber}.`, xp: 0 };
        await awardAchievement(doctorId, weekAch);
        celebrations.push({ tier: 3, ...weekAch });
      }
    }
  }

  // 4) Framework completion — all published missions done.
  const total = await Mission.countDocuments({ frameworkId: mission.frameworkId, status: 'published' });
  const done = await UserMissionProgress.countDocuments({ doctorId, frameworkId: mission.frameworkId, status: { $in: ['completed', 'skipped'] } });
  if (total > 0 && done >= total) {
    const fwAch = { type: 'framework', title: 'Programme complete', message: 'You built a real digital presence, one mission at a time.', xp: 0 };
    await awardAchievement(doctorId, fwAch);
    await addJourney(doctorId, { type: 'milestone', title: 'Practice established', description: 'Completed the full programme.' });
    celebrations.push({ tier: 4, ...fwAch });
  }

  // Return the highest-tier celebration for the Focus session to show.
  celebrations.sort((a, b) => b.tier - a.tier);
  return celebrations[0] || null;
}

// Upcoming achievement hint for the dashboard: the next week boundary.
export async function getUpcomingAchievement(doctorId, days) {
  const nextIncomplete = days.find((d) => d.status !== 'completed' && d.status !== 'skipped');
  if (!nextIncomplete) return null;
  const week = nextIncomplete.weekNumber;
  const remainingInWeek = days.filter((d) => d.weekNumber === week && d.status !== 'completed' && d.status !== 'skipped').length;
  return { title: `Week ${week} complete`, remaining: remainingInWeek };
}
