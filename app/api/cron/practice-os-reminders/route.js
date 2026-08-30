import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PracticeOsEnrollment from '@/models/practice-os/PracticeOsEnrollment';
import Framework from '@/models/practice-os/Framework';
import Mission from '@/models/practice-os/Mission';
import UserMissionProgress from '@/models/practice-os/UserMissionProgress';
import Doctor from '@/models/Doctor';
import { sendPracticeOsReminderEmail } from '@/lib/email';
import { sendSMS } from '@/lib/twilio';
import { fireWyltoWebhook } from '@/lib/wylto';

export const runtime = 'nodejs';

const DAY_MS = 86400000;

/**
 * GET /api/cron/practice-os-reminders
 *
 * Rule-based Practice OS notification engine (CLAUDE.md §8, accountability
 * mechanics 6 & 3). Runs daily. For each active enrollment it sends at most one
 * reminder per day, choosing the single most-urgent rule that applies:
 *
 *   1. Human rescue    — dark >= 7 days and not yet rescued (once, ever).
 *   2. Waiting nudge    — dark >= 3 days.
 *   3. Today is ready   — today's day is unlocked and dark >= 1 day.
 *
 * Copy is plain, adult and non-shaming — it leads with what's next and never
 * says "you missed". No medical claims (NMC-safe).
 */
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const allActive = await PracticeOsEnrollment.find({ status: 'active' });
    // Skip enrollments whose pack no longer exists — otherwise a deleted pack
    // keeps emailing its doctors (handles orphans from packs deleted earlier).
    const liveFwIds = new Set((await Framework.find({ deletedAt: null }).select('_id').lean()).map((f) => String(f._id)));
    const enrollments = allActive.filter((e) => liveFwIds.has(String(e.frameworkId)));

    const now = new Date();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://curago.in';
    const ctaUrl = `${appUrl}/practice-os`;

    let processed = 0;
    let sent = 0;
    const results = [];

    for (const enrollment of enrollments) {
      processed++;

      try {
        // At most one reminder per calendar day.
        if (enrollment.lastReminderAt && isSameDay(enrollment.lastReminderAt, now)) {
          continue;
        }

        const doctor = await Doctor.findById(enrollment.doctorId);
        if (!doctor || !doctor.email) {
          continue;
        }

        const lastActive = enrollment.lastActiveAt || enrollment.startedAt || enrollment.createdAt;
        const daysInactive = lastActive
          ? Math.floor((now.getTime() - new Date(lastActive).getTime()) / DAY_MS)
          : 0;

        const todaysMissionReady =
          !enrollment.nextUnlockAt || new Date(enrollment.nextUnlockAt) <= now;

        // Choose the single most-urgent applicable rule.
        let reminder = null;

        if (daysInactive >= 7 && !enrollment.rescueNudgedAt) {
          reminder = {
            subject: 'Picking up where you left off',
            heading: 'Your programme is still here whenever you are',
            body: `You've finished ${enrollment.daysCompleted} of 28 days, and everything you built is still working for your patients. When you have thirty minutes, your next day is ready — start with just step one. If anything is getting in the way, reply to this message and we'll sort it out together.`,
            ctaLabel: 'Open your next day',
            sms: `Zero To Practice Builder: You've done ${enrollment.daysCompleted} of 28 days and it's all still working. Your next day is ready whenever you have 30 minutes — start with step one. ${ctaUrl}`,
            markRescued: true,
          };
        } else if (daysInactive >= 3) {
          reminder = {
            subject: 'Your next day is ready',
            heading: 'Your next day is ready',
            body: `You're on day ${enrollment.currentDayNumber} of 28. Your next task is waiting whenever you have thirty minutes — one small step moves it forward.`,
            ctaLabel: 'Start your next day',
            sms: `Zero To Practice Builder: Your next day (day ${enrollment.currentDayNumber} of 28) is ready whenever you have 30 minutes. ${ctaUrl}`,
          };
        } else if (todaysMissionReady && daysInactive >= 1) {
          reminder = {
            subject: "Today's task is ready",
            heading: "Today's task is ready",
            body: `Day ${enrollment.currentDayNumber} of 28 is unlocked and waiting. It should take about thirty minutes — a good time to pick it up.`,
            ctaLabel: 'Start today',
            sms: `Zero To Practice Builder: Day ${enrollment.currentDayNumber} of 28 is ready — about 30 minutes. ${ctaUrl}`,
          };
        }

        if (!reminder) {
          continue;
        }

        // Email — one failure must not abort the loop.
        try {
          await sendPracticeOsReminderEmail({
            email: doctor.email,
            name: doctor.displayName || doctor.name,
            subject: reminder.subject,
            heading: reminder.heading,
            body: reminder.body,
            ctaLabel: reminder.ctaLabel,
            ctaUrl,
          });
        } catch (emailError) {
          console.error(`[PracticeOS Reminders] Email failed for ${enrollment._id}:`, emailError);
        }

        // SMS — only if a phone number exists; also isolated.
        const phone = doctor.phone || doctor.whatsappNumber;
        if (phone) {
          try {
            await sendSMS(phone, reminder.sms);
          } catch (smsError) {
            console.error(`[PracticeOS Reminders] SMS failed for ${enrollment._id}:`, smsError);
          }
        }

        // WhatsApp — daily "finish today's module" nudge via Wylto.
        const waPhone = doctor.whatsappNumber || doctor.phone;
        if (waPhone) {
          // Look up the pack + the doctor's current (first uncompleted) mission/task
          // so the reminder message can name exactly what's next.
          let packTitle = '';
          let missionTitle = '';
          let itemLabel = 'mission';
          try {
            const fw = await Framework.findById(enrollment.frameworkId).select('title mode').lean();
            packTitle = fw?.title || '';
            itemLabel = fw?.mode === 'task' ? 'task' : 'mission';
            const doneIds = new Set(
              (await UserMissionProgress.find({
                doctorId: doctor._id,
                frameworkId: enrollment.frameworkId,
                status: { $in: ['completed', 'skipped'] },
              })
                .select('missionId')
                .lean()).map((p) => String(p.missionId))
            );
            const missions = await Mission.find({ frameworkId: enrollment.frameworkId, status: 'published' })
              .sort({ weekNumber: 1, dayNumber: 1, missionNumber: 1, order: 1 })
              .select('missionText title')
              .lean();
            const current = missions.find((m) => !doneIds.has(String(m._id)));
            missionTitle = current?.title || current?.missionText || '';
          } catch (lookupError) {
            console.error(`[PracticeOS Reminders] Mission lookup failed for ${enrollment._id}:`, lookupError);
          }

          try {
            await fireWyltoWebhook('moduleReminder', {
              name: doctor.displayName || doctor.name,
              phoneNumber: waPhone,
              dayNumber: enrollment.currentDayNumber,
              daysCompleted: enrollment.daysCompleted,
              packTitle,
              missionTitle,
              itemLabel,
            });
          } catch (waError) {
            console.error(`[PracticeOS Reminders] WhatsApp failed for ${enrollment._id}:`, waError);
          }
        }

        enrollment.lastReminderAt = now;
        if (reminder.markRescued) {
          enrollment.rescueNudgedAt = now;
        }
        await enrollment.save();

        sent++;
        results.push({ id: enrollment._id, rule: reminder.subject });
      } catch (loopError) {
        console.error(`[PracticeOS Reminders] Failed for enrollment ${enrollment._id}:`, loopError);
      }
    }

    return NextResponse.json({ processed, sent, results });
  } catch (error) {
    console.error('[PracticeOS Reminders] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Cron job failed' },
      { status: 500 }
    );
  }
}

function isSameDay(a, b) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Allow POST as well, matching the other cron routes.
export async function POST(request) {
  return GET(request);
}
