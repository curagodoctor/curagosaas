/**
 * Phase C — service-specific content pages, reusing the blog-article pipeline.
 *
 * Seeds a content topic (source: 'service') for each of the doctor's APPROVED
 * treatments that they don't already have a page for. The existing content engine
 * then writes each as a DRAFT blog article (via the double-run) following a
 * service-page structure; the doctor/clinician reviews and publishes it — nothing
 * is auto-published. Deduped against existing blogs, clusters and prior topics, so
 * a service already covered is never re-created.
 */
import DoctorContentTopic from '@/models/practice-os/DoctorContentTopic';
import PracticeOsDiseaseCluster from '@/models/practice-os/PracticeOsDiseaseCluster';
import Doctor from '@/models/Doctor';
import { normalizeTopic } from '@/lib/practice-os/trendTopics';
import BlogArticle from '@/models/BlogArticle';

// Existing-content keys to dedup against (published/draft blogs + prior topics).
async function existingKeys(doctorId) {
  const [blogs, topics] = await Promise.all([
    BlogArticle.find({ doctorId, status: { $in: ['published', 'draft', 'scheduled'] } }).select('title').lean(),
    DoctorContentTopic.find({ doctorId }).select('normalizedKey').lean(),
  ]);
  const set = new Set();
  for (const b of blogs) { const k = normalizeTopic(b.title); if (k) set.add(k); }
  for (const t of topics) if (t.normalizedKey) set.add(t.normalizedKey);
  return set;
}

/**
 * Queue service-page topics for the doctor's approved treatments. Returns counts.
 */
export async function seedServiceTopics(doctorId) {
  const [doctor, clusters] = await Promise.all([
    Doctor.findById(doctorId).select('specialization city').lean(),
    PracticeOsDiseaseCluster.find({ doctorId, approved: true }).select('name treatments').lean(),
  ]);
  const city = (doctor?.city || '').trim();

  // Distinct treatment names across approved clusters (fallback to the cluster/
  // condition name when a cluster has no explicit treatments).
  const names = [];
  for (const c of clusters) {
    const ts = (c.treatments || []).map((t) => (t?.name || '').trim()).filter(Boolean);
    if (ts.length) names.push(...ts); else if (c.name) names.push(String(c.name).trim());
  }
  const distinct = [...new Set(names.filter(Boolean))];
  if (!distinct.length) return { added: 0, skipped: 0, total: 0 };

  const existing = await existingKeys(doctorId);
  let added = 0, skipped = 0;
  for (const name of distinct) {
    // A local, patient-facing service title. The architect+writer refine it.
    const title = city ? `${name} in ${city}` : name;
    const key = normalizeTopic(title);
    if (!key || existing.has(key)) { skipped++; continue; }
    existing.add(key);
    const r = await DoctorContentTopic.updateOne(
      { doctorId, normalizedKey: key },
      { $setOnInsert: { doctorId, title, normalizedKey: key, source: 'service', status: 'queued', specialty: doctor?.specialization || '', city } },
      { upsert: true },
    );
    if (r.upsertedCount) added++; else skipped++;
  }
  return { added, skipped, total: distinct.length };
}
