/**
 * Turn weekly SerpAPI search trends into actionable, per-doctor content topics:
 * take the AI's suggested topics, dedup them against the doctor's EXISTING content
 * (published/draft blogs, disease clusters, and topics already on file), and store
 * the fresh ones as queued topics in the doctor's DB. Recurring/covered topics are
 * recorded as 'covered' rather than re-queued, so we never rewrite the same thing.
 */
import DoctorContentTopic from '@/models/practice-os/DoctorContentTopic';
import BlogArticle from '@/models/BlogArticle';
import PracticeOsDiseaseCluster from '@/models/practice-os/PracticeOsDiseaseCluster';
import { getOrRefreshTrendsForDoctor } from '@/lib/practice-os/searchTrends';

// Generic/structural words that shouldn't drive a topic's identity.
const STOP = new Set(['the', 'a', 'an', 'in', 'of', 'for', 'and', 'to', 'your', 'you', 'is', 'are', 'how', 'what', 'why', 'when', 'with', 'best', 'top', 'near', 'me', 'doctor', 'doctors', 'guide', 'understanding', 'explained', 'vs', 'about']);

// A normalized dedup key: lowercase, strip punctuation + stopwords, light
// de-pluralize, then a sorted unique token set so "gallstone surgery" and
// "surgery for gallstones" collapse to the same key.
export function normalizeTopic(s) {
  const words = String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => (w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w)); // light depluralize
  return [...new Set(words)].sort().join(' ');
}

// Map of normalizedKey -> human label of the existing content that covers it.
async function getExistingContentKeys(doctorId) {
  const [blogs, clusters] = await Promise.all([
    BlogArticle.find({ doctorId, status: { $in: ['published', 'draft', 'scheduled'] } }).select('title').lean(),
    PracticeOsDiseaseCluster.find({ doctorId }).select('name treatments').lean(),
  ]);
  const map = new Map();
  for (const b of blogs) { const k = normalizeTopic(b.title); if (k) map.set(k, `blog: ${b.title}`); }
  for (const c of clusters) {
    const k = normalizeTopic(c.name); if (k) map.set(k, `condition: ${c.name}`);
    for (const t of (c.treatments || [])) { const tk = normalizeTopic(t.name); if (tk) map.set(tk, `treatment: ${t.name}`); }
  }
  return map;
}

/**
 * Refresh this doctor's content topics from the current week's trends. Idempotent:
 * existing topics (any status) are never duplicated or downgraded. Returns counts.
 */
export async function refreshTrendTopicsForDoctor(doctorId, { force = false } = {}) {
  const { status, report } = await getOrRefreshTrendsForDoctor(doctorId, { force });
  if (status !== 'ok' || !report) return { status, added: 0, covered: 0 };
  const topics = report.suggestedTopics || [];
  if (!topics.length) return { status: 'ok', added: 0, covered: 0 };

  const existing = await getExistingContentKeys(doctorId);
  let added = 0, covered = 0;
  for (const title of topics) {
    const key = normalizeTopic(title);
    if (!key) continue;
    const coveredBy = existing.get(key);
    const base = { doctorId, title, normalizedKey: key, source: 'search-trends', specialty: report.specialty, city: report.city, weekStart: report.weekStart };
    // $setOnInsert only — never flip a topic that's already produced/dismissed/queued.
    const set = coveredBy ? { ...base, status: 'covered', coveredBy } : { ...base, status: 'queued' };
    const r = await DoctorContentTopic.updateOne({ doctorId, normalizedKey: key }, { $setOnInsert: set }, { upsert: true });
    if (r.upsertedCount) { if (coveredBy) covered++; else added++; }
  }
  return { status: 'ok', added, covered };
}

export async function listDoctorTopics(doctorId) {
  return DoctorContentTopic.find({ doctorId }).sort({ status: 1, createdAt: -1 }).lean();
}

export async function nextQueuedTopic(doctorId) {
  return DoctorContentTopic.findOne({ doctorId, status: 'queued' }).sort({ createdAt: 1 });
}

export async function dismissTopic(doctorId, topicId) {
  await DoctorContentTopic.updateOne({ _id: topicId, doctorId, status: { $in: ['queued', 'covered'] } }, { $set: { status: 'dismissed' } });
}
