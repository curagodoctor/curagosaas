// Clearing cached day-interface content. The daily tasks draft their content from
// the doctor's approved disease/treatment map (via {{treatment_one}} etc.). Any
// change to that map (regenerate, edit a name, reorder, delete) can shift what
// treatment_one resolves to — which would leave already-drafted day content stale
// (title updates live, but the saved draft doesn't). So whenever the map changes
// we clear the cached drafts for NOT-yet-completed missions, and each day then
// regenerates fresh from the current map. Completed tasks are left untouched.
import PracticeOsChatMessage from '@/models/practice-os/PracticeOsChatMessage';
import UserMissionProgress from '@/models/practice-os/UserMissionProgress';

export async function clearDayContent(doctorId) {
  try {
    const doneIds = (await UserMissionProgress.find({ doctorId, status: 'completed' }).select('missionId').lean())
      .map((p) => p.missionId);
    await PracticeOsChatMessage.deleteMany({ doctorId, missionId: { $nin: doneIds } });
    // Also drop any in-progress focus drafts on the incomplete missions.
    await UserMissionProgress.updateMany(
      { doctorId, status: { $ne: 'completed' }, draft: { $ne: null } },
      { $set: { draft: null } },
    );
  } catch { /* best-effort — never block a map change on this */ }
}
