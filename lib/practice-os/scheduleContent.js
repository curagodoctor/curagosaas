/**
 * Helpers for auto-scheduling generated blog/service pages. Reuses the existing
 * BlogArticle `status: 'scheduled'` + `scheduledAt` + the daily content-scheduler
 * cron (which publishes scheduled articles once their time arrives).
 */
import BlogArticle from '@/models/BlogArticle';

const DAY = 24 * 60 * 60 * 1000;

/**
 * The next publish slot for a doctor: `cadenceDays` after their latest scheduled
 * article (or after now if none is pending), so a batch drips out instead of all
 * going live at once. Always at least ~1 day in the future.
 */
export async function nextScheduleSlot(doctorId, cadenceDays = 3) {
  const cadence = Math.max(1, Math.min(30, Number(cadenceDays) || 3));
  const last = await BlogArticle.findOne({ doctorId, status: 'scheduled' })
    .sort({ scheduledAt: -1 }).select('scheduledAt').lean();
  const now = Date.now();
  const lastTs = last?.scheduledAt ? new Date(last.scheduledAt).getTime() : 0;
  const base = lastTs > now ? lastTs : now;
  return new Date(base + cadence * DAY);
}
