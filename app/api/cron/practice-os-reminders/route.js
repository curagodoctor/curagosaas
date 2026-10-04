import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PracticeOsEnrollment from '@/models/practice-os/PracticeOsEnrollment';
import Framework from '@/models/practice-os/Framework';
import Mission from '@/models/practice-os/Mission';
import UserMissionProgress from '@/models/practice-os/UserMissionProgress';
import BlogArticle from '@/models/BlogArticle';
import Doctor from '@/models/Doctor';
import { sendPracticeOsReminderEmail } from '@/lib/email';
import { sendSMS } from '@/lib/twilio';
import { fireWyltoWebhook, sendWyltoTemplate } from '@/lib/wylto';
import PracticeOsProfile from '@/models/practice-os/PracticeOsProfile';
import { getTreatmentFlat, treatmentVars, fillTreatmentTokens } from '@/lib/practice-os/engine';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';

export const runtime = 'nodejs';

const DAY_MS = 86400000;

// §11/§14 — the doctor's preferred notification window, in IST hours. The cron
// runs hourly and only sends when the current IST hour is inside the window
// (the once-per-day guard means they get exactly one, at their chosen time).
const WINDOW_HOURS = {
  morning: [6, 12], afternoon: [12, 17], evening: [17, 21], night: [21, 24],
};
function istHour(now = new Date()) {
  return Number(now.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' })) % 24;
}
function inWindow(window, hour) {
  const [start, end] = WINDOW_HOURS[window] || WINDOW_HOURS.evening;
  return hour >= start && hour < end;
}

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
    const hourNow = istHour(now);
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

        // §11/§14 — only send inside the doctor's preferred window (defaults to
        // evening). The cron runs hourly; this delivers at the chosen time.
        const prof = await PracticeOsProfile.findOne({ doctorId: enrollment.doctorId }).select('notificationWindow scheduleType curagoDay').lean();
        // Weekly doctors are only reminded on their chosen CuraGo day (0=Sun…6=Sat, IST).
        if (prof?.scheduleType === 'weekly' && typeof prof.curagoDay === 'number') {
          const istDow = new Date(now.getTime() + 5.5 * 3600 * 1000).getUTCDay();
          if (prof.curagoDay !== istDow) continue;
        }
        if (!inWindow(prof?.notificationWindow || 'evening', hourNow)) {
          continue;
        }

        const lastActive = enrollment.lastActiveAt || enrollment.startedAt || enrollment.createdAt;
        const daysInactive = lastActive
          ? Math.floor((now.getTime() - new Date(lastActive).getTime()) / DAY_MS)
          : 0;

        const todaysMissionReady =
          !enrollment.nextUnlockAt || new Date(enrollment.nextUnlockAt) <= now;

        // Resolve the doctor's next task + pack ONCE, for every channel, with the
        // {{treatment_*}} placeholders filled to the doctor's real treatments — so
        // no reminder ever shows a raw token or the old programme name.
        let packTitle = 'Dominate Organic Search';
        let itemLabel = 'mission';
        let missionTitle = '';
        try {
          const fw = await Framework.findById(enrollment.frameworkId).select('title mode').lean();
          if (fw?.title) packTitle = fw.title;
          itemLabel = fw?.mode === 'task' ? 'task' : 'mission';
          const doneIds = new Set(
            (await UserMissionProgress.find({
              doctorId: doctor._id,
              frameworkId: enrollment.frameworkId,
              status: { $in: ['completed', 'skipped'] },
            }).select('missionId').lean()).map((p) => String(p.missionId))
          );
          const missions = await Mission.find({ frameworkId: enrollment.frameworkId, status: 'published' })
            .sort({ weekNumber: 1, dayNumber: 1, missionNumber: 1, order: 1 })
            .select('missionText title').lean();
          const current = missions.find((m) => !doneIds.has(String(m._id)));
          missionTitle = current?.title || current?.missionText || '';
          if (missionTitle.includes('{{')) {
            // Pass the doctor's profile fields so the treatment tokens resolve even
            // when there's no approved cluster map (falls back to profile
            // procedures) — and profileFields already carries treatment_one…thirty.
            const pf = await getDoctorProfileFields(doctor._id);
            const flat = await getTreatmentFlat(doctor._id, pf);
            missionTitle = fillTreatmentTokens(missionTitle, { ...pf, ...treatmentVars(flat) });
            // Safety net: NEVER let an unfilled {{token}} reach WhatsApp. Strip any
            // leftover "— {{x}} & {{y}}" fragment and any stray token, then tidy.
            if (missionTitle.includes('{{')) {
              missionTitle = missionTitle
                .replace(/\s*[—–-]\s*\{\{[^}]*\}\}(?:\s*&\s*\{\{[^}]*\}\})*/g, '')
                .replace(/\{\{[^}]*\}\}/g, '');
            }
            missionTitle = missionTitle.replace(/\s{2,}/g, ' ').trim();
          }
        } catch (lookupError) {
          console.error(`[PracticeOS Reminders] Mission lookup failed for ${enrollment._id}:`, lookupError);
        }
        const taskLine = missionTitle ? `\n\nYour next task: ${missionTitle}` : '';
        const taskSms = missionTitle ? ` Next: ${missionTitle}.` : '';

        // Choose the single most-urgent applicable rule.
        let reminder = null;

        if (daysInactive >= 7 && !enrollment.rescueNudgedAt) {
          reminder = {
            subject: 'Picking up where you left off',
            heading: 'Your programme is still here whenever you are',
            body: `You've finished ${enrollment.daysCompleted} of 28 days of Dominate Organic Search, and everything you built is still working for your patients. When you have thirty minutes, your next task is ready — start with just step one.${taskLine}\n\nIf anything is getting in the way, reply to this message and we'll sort it out together.`,
            ctaLabel: 'Open your next task',
            sms: `Dominate Organic Search: You've done ${enrollment.daysCompleted} of 28 days and it's all still working.${taskSms} Ready whenever you have 30 minutes. ${ctaUrl}`,
            markRescued: true,
          };
        } else if (daysInactive >= 3) {
          reminder = {
            subject: 'Your next task is ready',
            heading: 'Your next task is ready',
            body: `You're on day ${enrollment.currentDayNumber} of 28 of Dominate Organic Search. Your next task is waiting whenever you have thirty minutes — one small step moves it forward.${taskLine}`,
            ctaLabel: 'Start your next task',
            sms: `Dominate Organic Search: Day ${enrollment.currentDayNumber} of 28 is ready whenever you have 30 minutes.${taskSms} ${ctaUrl}`,
          };
        } else if (todaysMissionReady && daysInactive >= 1) {
          reminder = {
            subject: "Today's task is ready",
            heading: "Today's task is ready",
            body: `Day ${enrollment.currentDayNumber} of 28 of Dominate Organic Search is unlocked and waiting. It should take about thirty minutes — a good time to pick it up.${taskLine}`,
            ctaLabel: 'Start today',
            sms: `Dominate Organic Search: Day ${enrollment.currentDayNumber} of 28 is ready — about 30 minutes.${taskSms} ${ctaUrl}`,
          };
        }

        // §11 — content-first: if AI content is waiting for review, send a custom
        // preview message (with the page title + excerpt) instead of a generic
        // reminder. This overrides the mission reminder and points at the draft.
        const draft = await BlogArticle.findOne({ doctorId: doctor._id, status: 'draft' })
          .select('title excerpt').sort({ createdAt: -1 }).lean();
        if (draft) {
          const preview = (draft.excerpt || '').trim().slice(0, 160);
          reminder = {
            subject: 'Your next educational page is ready',
            heading: 'Your next page is ready to review',
            body: `Your next educational page — "${draft.title}" — is ready.${preview ? `\n\n${preview}…` : ''}\n\nAbout 10 minutes to review, then publish with one tap.`,
            ctaLabel: 'Review & publish',
            ctaUrl: `${appUrl}/admin/dashboard/blog-articles`,
            sms: `CuraGo: Your next page "${draft.title}" is ready to review — about 10 min, publish with one tap. ${appUrl}/admin/dashboard/blog-articles`,
            isContent: true,
            contentTitle: draft.title,
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
            ctaUrl: reminder.ctaUrl || ctaUrl,
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

        // WhatsApp — content-first (§11): if content is waiting, send the
        // "your next content is ready" template; otherwise the module nudge.
        const waPhone = doctor.whatsappNumber || doctor.phone;
        if (waPhone && reminder.isContent) {
          try {
            // Direct Wylto send of the approved `content_ready_review` template:
            // {{1}} = doctor name, {{2}} = page title.
            await sendWyltoTemplate({
              to: waPhone,
              templateName: process.env.WYLTO_CONTENT_TEMPLATE || 'content_ready_review',
              language: 'en',
              bodyParams: [doctor.displayName || doctor.name || 'Doctor', reminder.contentTitle || 'your next page'],
            });
          } catch (waError) {
            console.error(`[PracticeOS Reminders] WhatsApp (content) failed for ${enrollment._id}:`, waError);
          }
        } else if (waPhone) {
          // packTitle / itemLabel / missionTitle were resolved above (tokens filled),
          // so the WhatsApp message names exactly what's next.
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

    // ---- Content Planner reminders ----------------------------------------
    // Send any self-reminders the doctor set on a planned content item that are
    // now due. Isolated so a failure here never affects the mission reminders.
    let contentReminders = 0;
    try {
      const PracticeOsDocument = (await import('@/models/practice-os/PracticeOsDocument')).default;
      const due = await PracticeOsDocument.find({
        kind: 'reel', reminderSent: { $ne: true }, remindAt: { $ne: null, $lte: now },
      }).limit(200).lean();
      for (const d of due) {
        try {
          const doctor = await Doctor.findById(d.doctorId).select('email displayName name').lean();
          if (doctor?.email) {
            await sendPracticeOsReminderEmail({
              email: doctor.email,
              name: doctor.displayName || doctor.name,
              subject: 'A content reminder from your planner',
              heading: 'Time to work on your content',
              body: `You set a reminder for "${d.title}". Open your Content Planner to refine, schedule, or record it.`,
              ctaLabel: 'Open Content Planner',
              ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://curago.in'}/app/control-center/planner`,
            });
          }
          await PracticeOsDocument.updateOne({ _id: d._id }, { $set: { reminderSent: true } });
          contentReminders++;
        } catch (itemErr) {
          console.error(`[PracticeOS Reminders] Content reminder failed for ${d._id}:`, itemErr);
        }
      }
    } catch (contentErr) {
      console.error('[PracticeOS Reminders] Content reminders pass failed:', contentErr);
    }

    return NextResponse.json({ processed, sent, results, contentReminders });
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
