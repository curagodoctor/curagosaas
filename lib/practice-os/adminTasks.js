import PracticeOsEnrollment from '@/models/practice-os/PracticeOsEnrollment';
import UserMissionProgress from '@/models/practice-os/UserMissionProgress';

/**
 * Admin override: restart a doctor's Practice OS tasks from Day 1.
 *
 * Clears ALL mission/task progress (every mission becomes incomplete) and resets
 * each enrollment's position to Day 1 opening now, so the sequence-paced unlock
 * restarts and the daily engine serves Day 1 again. Deliberately an exception to
 * the "progress is monotonic" rule — it's a manual admin action.
 *
 * Intentionally does NOT delete the doctor's published blogs/assets, scores, or
 * journey history — only the task progress + enrollment position are reset.
 */
export async function restartDoctorTasks(doctorId) {
  const now = new Date();
  const del = await UserMissionProgress.deleteMany({ doctorId });

  const enrollments = await PracticeOsEnrollment.find({ doctorId });
  for (const e of enrollments) {
    e.startedAt = now;               // Day 1 opens now
    e.nextUnlockAt = null;           // Day 1 immediately actionable
    e.currentDayNumber = 1;
    e.daysCompleted = 0;
    e.aheadUsed = false;
    e.lastTaskEmailedMissionId = null; // let today's Day-1 email go out again
    e.lastTaskEmailedAt = null;
    if (e.status === 'completed') e.status = 'active';
    await e.save();
  }

  return { enrollmentsReset: enrollments.length, progressCleared: del.deletedCount || 0 };
}
