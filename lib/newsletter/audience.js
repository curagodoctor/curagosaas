import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import CohortAssessment from '@/models/CohortAssessment';
import Waitlist from '@/models/Waitlist';
import NewsletterUnsubscribe from '@/models/NewsletterUnsubscribe';

// Human-facing metadata for each audience segment.
export const SEGMENT_META = {
  doctors:  { key: 'doctors',  label: 'Doctors',          desc: 'Curago account holders' },
  cohort:   { key: 'cohort',   label: 'Cohort leads',     desc: 'Fit assessment / cohort waitlist' },
  waitlist: { key: 'waitlist', label: 'Landing waitlist', desc: 'Practice Builder landing signups' },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Collect {email, name} for one segment from its source collection.
async function collectSegment(seg) {
  if (seg === 'doctors') {
    const rows = await Doctor.find({ email: { $nin: [null, ''] } }).select('email name displayName').lean();
    return rows.map((d) => ({ email: d.email, name: d.displayName || d.name || '' }));
  }
  if (seg === 'cohort') {
    const rows = await CohortAssessment.find({ email: { $nin: [null, ''] } }).select('email name').lean();
    return rows.map((c) => ({ email: c.email, name: c.name || '' }));
  }
  if (seg === 'waitlist') {
    const rows = await Waitlist.find({ email: { $nin: [null, ''] } }).select('email name').lean();
    return rows.map((w) => ({ email: w.email, name: w.name || '' }));
  }
  return [];
}

/**
 * Build the deduped recipient list for the given segments, excluding anyone on
 * the global suppression list. First occurrence wins for the display name, in
 * segment priority order (doctors → cohort → waitlist).
 * Returns { recipients: [{email, name, sources: []}], total, suppressed }.
 */
export async function getAudience(segments) {
  await connectDB();
  const wanted = (segments || []).filter((s) => SEGMENT_META[s]);
  if (!wanted.length) return { recipients: [], total: 0, suppressed: 0 };

  // Priority order for name resolution.
  const ordered = ['doctors', 'cohort', 'waitlist'].filter((s) => wanted.includes(s));

  const byEmail = new Map();
  for (const seg of ordered) {
    const rows = await collectSegment(seg);
    for (const r of rows) {
      const email = String(r.email || '').toLowerCase().trim();
      if (!EMAIL_RE.test(email)) continue;
      if (!byEmail.has(email)) {
        byEmail.set(email, { email, name: r.name || '', sources: [seg] });
      } else {
        const ex = byEmail.get(email);
        if (!ex.name && r.name) ex.name = r.name;
        if (!ex.sources.includes(seg)) ex.sources.push(seg);
      }
    }
  }

  // Drop suppressed addresses.
  const suppressedSet = new Set(
    (await NewsletterUnsubscribe.find({}).select('email').lean()).map((u) => u.email)
  );
  let suppressed = 0;
  const recipients = [];
  for (const rec of byEmail.values()) {
    if (suppressedSet.has(rec.email)) { suppressed++; continue; }
    recipients.push(rec);
  }

  return { recipients, total: recipients.length, suppressed };
}

// Per-segment counts (for the composer UI), independent of dedupe.
export async function getSegmentCounts() {
  await connectDB();
  const [doctors, cohort, waitlist] = await Promise.all([
    Doctor.countDocuments({ email: { $nin: [null, ''] } }),
    CohortAssessment.countDocuments({ email: { $nin: [null, ''] } }),
    Waitlist.countDocuments({ email: { $nin: [null, ''] } }),
  ]);
  return { doctors, cohort, waitlist };
}

// --- Unsubscribe token (signed, no DB lookup needed to verify) ---
const SECRET = process.env.JWT_SECRET || 'dev-newsletter-secret';

export function makeUnsubscribeToken(email) {
  const e = String(email).toLowerCase().trim();
  const sig = crypto.createHmac('sha256', SECRET).update(`unsub:${e}`).digest('base64url');
  const payload = Buffer.from(e).toString('base64url');
  return `${payload}.${sig}`;
}

export function verifyUnsubscribeToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  let email;
  try { email = Buffer.from(payload, 'base64url').toString('utf8'); } catch { return null; }
  const expected = crypto.createHmac('sha256', SECRET).update(`unsub:${email}`).digest('base64url');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch { return null; }
  return email;
}

export function unsubscribeUrl(email) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://curago.in';
  return `${base}/api/newsletter/unsubscribe?token=${encodeURIComponent(makeUnsubscribeToken(email))}`;
}
