import NewsletterSequence from '@/models/NewsletterSequence';
import SequenceSubscriber from '@/models/SequenceSubscriber';
import Newsletter from '@/models/Newsletter';
import NewsletterUnsubscribe from '@/models/NewsletterUnsubscribe';
import { getAudience } from '@/lib/newsletter/audience';
import { sendNewsletterTest } from '@/lib/newsletter/send';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const AUDIENCE_SEGMENTS = ['doctors', 'cohort', 'waitlist'];

// Enroll one email into a sequence. Idempotent per (sequence, email); the first
// step is scheduled at now + step0.delayDays.
export async function enrollEmail(sequence, email, name = '', source = 'auto') {
  const e = String(email || '').toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return false;
  const existing = await SequenceSubscriber.findOne({ sequenceId: sequence._id, email: e }).select('_id').lean();
  if (existing) return false;
  const delay0 = sequence.steps?.[0]?.delayDays || 0;
  try {
    await SequenceSubscriber.create({
      sequenceId: sequence._id, email: e, name: name || '', source,
      stepIndex: 0, nextSendAt: new Date(Date.now() + delay0 * MS_PER_DAY), status: 'active',
    });
    return true;
  } catch { return false; }   // duplicate-key race → already enrolled
}

// Sync the whole newsletter audience into an auto-enroll sequence (new contacts).
export async function syncAudienceEnroll(sequence) {
  if (!sequence.autoEnroll) return 0;
  const { recipients } = await getAudience(AUDIENCE_SEGMENTS);
  let added = 0;
  for (const r of recipients) {
    if (await enrollEmail(sequence, r.email, r.name, 'auto')) added++;
  }
  return added;
}

// Send whatever steps are due for a sequence, then advance each subscriber.
export async function processSequence(sequence, { limit = 800 } = {}) {
  const steps = sequence.steps || [];
  if (!steps.length) return { sent: 0, completed: 0, skipped: 0 };

  const nlIds = steps.map((s) => s.newsletterId).filter(Boolean);
  const newsletters = await Newsletter.find({ _id: { $in: nlIds } }).lean();
  const nlById = new Map(newsletters.map((n) => [String(n._id), n]));
  const suppressed = new Set((await NewsletterUnsubscribe.find({}).select('email').lean()).map((u) => u.email));

  const now = new Date();
  const due = await SequenceSubscriber.find({
    sequenceId: sequence._id, status: 'active', nextSendAt: { $lte: now },
  }).limit(limit);

  let sent = 0, completed = 0, skipped = 0;
  for (const sub of due) {
    // Ended the sequence?
    if (sub.stepIndex >= steps.length) { sub.status = 'completed'; await sub.save(); completed++; continue; }
    // Globally unsubscribed → stop.
    if (suppressed.has(sub.email)) { sub.status = 'unsubscribed'; await sub.save(); skipped++; continue; }

    const step = steps[sub.stepIndex];
    const nl = step?.newsletterId ? nlById.get(String(step.newsletterId)) : null;

    if (nl) {
      const res = await sendNewsletterTest(nl, sub.email, sub.name);
      if (res.success) { sent++; sub.lastSentAt = now; }
      // On a send failure we still advance so one bad step doesn't wedge the flow.
    } else {
      skipped++;   // step's newsletter was deleted — skip it
    }

    sub.stepIndex += 1;
    if (sub.stepIndex >= steps.length) { sub.status = 'completed'; completed++; }
    else { const nextDelay = steps[sub.stepIndex]?.delayDays || 0; sub.nextSendAt = new Date(now.getTime() + nextDelay * MS_PER_DAY); }
    await sub.save();
  }
  return { sent, completed, skipped };
}

// Run every enabled sequence (auto-enroll + send due). Called by the daily cron.
export async function runAllSequences() {
  const sequences = await NewsletterSequence.find({ enabled: true });
  const results = [];
  for (const seq of sequences) {
    if (!seq.steps?.length) continue;
    const enrolled = await syncAudienceEnroll(seq);
    const r = await processSequence(seq);
    results.push({ id: String(seq._id), name: seq.name, enrolled, ...r });
  }
  return results;
}
