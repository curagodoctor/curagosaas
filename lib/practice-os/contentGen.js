import { structureLongContent } from '@/lib/practice-os/ai';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';
import { relatedReadingBlock } from '@/lib/practice-os/blogLinks';
import { chargeAiCredits } from '@/lib/practice-os/aiCredits';
import BlogArticle from '@/models/BlogArticle';
import Doctor from '@/models/Doctor';

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// Generate the doctor's NEXT education page — the first condition in their
// profile that doesn't have a page yet — as a DRAFT for review. Shared by the
// on-demand button (charge:true) and the overnight cron (charge:false, since the
// doctor didn't initiate it). Returns { created, done, id, title, cluster }.
export async function generateNextPage(doctorId, { charge = true } = {}) {
  const fields = await getDoctorProfileFields(doctorId);
  const candidates = String(fields.diseases || '')
    .split(/[,\n;]+/).map((s) => s.trim()).filter(Boolean)
    .map((name) => ({ name, slug: slugify(name) })).filter((c) => c.slug);
  if (!candidates.length) return { created: false, reason: 'NoConditions' };

  const existing = new Set(
    (await BlogArticle.find({ doctorId, diseaseCluster: { $ne: '' } }).select('diseaseCluster').lean())
      .map((a) => a.diseaseCluster),
  );
  const next = candidates.find((c) => !existing.has(c.slug));
  if (!next) return { created: false, done: true };

  const gen = await structureLongContent({
    instruction: 'Write a COMPREHENSIVE, in-depth patient-facing education page grounded in the doctor\'s profile and knowledge base. Return JSON: {"title": string (<=90 chars), "excerpt": string (<=180 chars), "category": string, "blocks": [{"heading": string, "content": string (3-6 paragraphs)}] } with 6-10 blocks (what it is, causes, symptoms, when to see a doctor, diagnosis, treatment options, prevention/aftercare, FAQs). Educational and NMC-compliant — no superlatives, no guarantees, no soliciting.',
    source: `Condition: ${next.name}. Specialty: ${fields.specialty || ''}. City: ${fields.city || ''}.`,
    profileFields: fields,
    topic: next.name,
  });
  if (!gen.success) return { created: false, reason: 'GenFailed', error: gen.error };

  const d = gen.data || {};
  const title = String(d.title || next.name).slice(0, 120);
  let slug = slugify(d.slug || title) || `article-${next.slug}`;
  if (await BlogArticle.findOne({ slug }).select('_id').lean()) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const blocks = Array.isArray(d.blocks)
    ? d.blocks.filter((b) => b && (b.heading || b.content)).map((b) => ({ heading: String(b.heading || '').slice(0, 160), content: String(b.content || '') }))
    : [];
  const related = await relatedReadingBlock(doctorId, next.slug);
  if (related) blocks.push(related);

  const doc = await Doctor.findById(doctorId).select('displayName name specialization').lean();
  const article = await BlogArticle.create({
    doctorId,
    title, slug,
    excerpt: String(d.excerpt || '').slice(0, 300),
    category: String(d.category || fields.specialty || '').slice(0, 60),
    author: { name: doc?.displayName || doc?.name || '', designation: doc?.specialization || '' },
    blocks,
    diseaseCluster: next.slug,
    pageType: 'disease',
    status: 'draft',
  });

  let creditsRemaining;
  if (charge) { const c = await chargeAiCredits(doctorId, { label: 'next-page' }); creditsRemaining = c.remaining; }
  return { created: true, id: String(article._id), title: article.title, cluster: next.name, creditsRemaining };
}
