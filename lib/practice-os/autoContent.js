// Server-side, system-initiated content generation + publishing for the daily-task
// email flow. This runs WITHOUT a logged-in doctor (cron + tokenised email links),
// so it never charges AI credits and never assumes a request context.
//
//  - generateMissionDraft(): draft the day's content + a featured image, stored in
//    the SAME PracticeOsChatMessage session the day page uses (so opening the day
//    shows the same draft).
//  - publishDayBlog(): turn that draft (or an edited version from the standalone
//    editor) into a live BlogArticle — one article per day (dedupe by sourceMissionId).
import { getDay } from '@/lib/practice-os/engine';
import { runMissionAssistant } from '@/lib/practice-os/ai';
import { getDoctorProfileContext, getDoctorProfileFields, isProfileReadyForAi } from '@/lib/practice-os/profile';
import { generateAiImage } from '@/lib/practice-os/images';
import { parseArticleFromMarkdown } from '@/lib/practice-os/parseArticle';
import { syncBlogLinksToProfile } from '@/lib/practice-os/blogLinks';
import PracticeOsChatMessage from '@/models/practice-os/PracticeOsChatMessage';
import BlogArticle from '@/models/BlogArticle';
import Doctor from '@/models/Doctor';

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const titleFrom = (content, fallback) =>
  (String(content).match(/^#+\s*(.+)$/m) || [])[1]?.replace(/[*_`#]/g, '').trim()
  || String(fallback || '').replace(/\{\{.*?\}\}/g, '').replace(/\s{2,}/g, ' ').trim()
  || 'Your task';

/**
 * Draft the day's task content (+ featured image) for a doctor, server-side.
 * Reuses the existing module thread so the day page shows the same draft.
 * Returns { content, imageUrl, title, primaryAction, external, dayNumber } or null.
 */
export async function generateMissionDraft(doctorId, missionId, { force = false } = {}) {
  const found = await getDay(doctorId, missionId);
  if (!found?.day) return null;
  const modules = found.modules || [];
  const module = modules[0] || null;
  const userPrompt = (module?.aiPrompt || (Array.isArray(module?.aiPrompts) ? module.aiPrompts[0] : '') || '').trim();
  if (!userPrompt) return null;
  const sessionId = module?.id ? `mod_${module.id}` : 'default';
  const primaryAction = found.day.primaryAction || { type: 'blog' };
  const external = !!primaryAction.type && primaryAction.type !== 'blog';

  const [profileContext, profileFields] = await Promise.all([
    getDoctorProfileContext(doctorId),
    getDoctorProfileFields(doctorId),
  ]);
  if (!isProfileReadyForAi(profileFields)) return null;

  // Reuse an existing draft unless forced (mirrors the day page's "don't re-draft").
  const existing = await PracticeOsChatMessage.findOne({ doctorId, missionId, sessionId, role: 'assistant' })
    .sort({ createdAt: -1 }).lean();

  let content;
  let imageUrl = '';
  if (existing && !force) {
    content = existing.content;
    imageUrl = existing.imageUrl || '';
  } else {
    const result = await runMissionAssistant({ mission: found.day, module, userPrompt, profileContext, profileFields, history: [] });
    if (!result.success || !result.text) return null;
    content = result.text;
    try {
      imageUrl = (await generateAiImage(doctorId, titleFrom(content, found.day.missionText), { kind: external ? 'post' : 'blog' })) || '';
    } catch { imageUrl = ''; }
    await PracticeOsChatMessage.create([
      { doctorId, missionId, sessionId, role: 'user', content: userPrompt, hidden: true },
      { doctorId, missionId, sessionId, role: 'assistant', content, imageUrl },
    ]);
  }

  return {
    content,
    imageUrl,
    title: titleFrom(content, found.day.missionText),
    primaryAction,
    external,
    dayNumber: found.day.dayNumber,
    missionText: String(found.day.missionText || '').replace(/\{\{.*?\}\}/g, '').trim(),
    // The doctor's name from THEIR profile (profile value wins; Google/Gmail name is
    // only the fallback inside getDoctorProfileFields) — so emails never greet them
    // by their raw Gmail display name.
    doctorName: profileFields.doctor_name || '',
  };
}

/** The latest assistant draft for a mission (any module thread), newest first. */
async function latestDraft(doctorId, missionId) {
  return PracticeOsChatMessage.findOne({ doctorId, missionId, role: 'assistant' }).sort({ createdAt: -1 }).lean();
}

/**
 * Publish (or re-publish) a day's blog page from its draft — or from `overrideText`
 * supplied by the standalone editor. One article per day: re-publishing updates the
 * same BlogArticle (dedupe by sourceMissionId) and keeps its live URL stable.
 * Returns { success, url, title, id } or { success:false, error }.
 */
export async function publishDayBlog(doctorId, missionId, overrideText = null) {
  const draft = await latestDraft(doctorId, missionId);
  const text = (overrideText != null ? String(overrideText) : draft?.content || '').trim();
  if (!text) return { success: false, error: 'There is no content to publish yet.' };
  const providedImage = /^https?:\/\//i.test(draft?.imageUrl || '') ? draft.imageUrl : '';

  const parsed = parseArticleFromMarkdown(text);
  if (!parsed || !parsed.blocks.length) return { success: false, error: 'The content could not be structured into a page.' };

  const doc = await Doctor.findById(doctorId).select('subdomain displayName name specialization').lean();
  if (!doc) return { success: false, error: 'Doctor not found.' };
  // Byline uses the doctor's PROFILE name (Dominate Organic Search), falling back to
  // their account/Google name — never the raw Gmail name when a profile name exists.
  const fields = await getDoctorProfileFields(doctorId).catch(() => ({}));
  const authorName = (fields.doctor_name || doc.displayName || doc.name || '').trim();

  const existing = await BlogArticle.findOne({ doctorId, sourceMissionId: missionId }).select('_id slug featuredImage').lean();
  const title = String(parsed.title || 'Untitled article').slice(0, 120);
  let slug;
  if (existing) {
    slug = existing.slug;
  } else {
    slug = slugify(title) || `article-${missionId}`;
    if (await BlogArticle.findOne({ slug }).select('_id').lean()) slug = `${slug}-${String(missionId).slice(-4)}`;
  }
  const metaDescription = String(parsed.metaDescription || parsed.excerpt || '').slice(0, 160);
  const fieldsToSet = {
    doctorId,
    title,
    slug,
    excerpt: metaDescription.slice(0, 300),
    metaDescription,
    category: String(doc.specialization || '').slice(0, 60),
    author: { name: authorName, designation: doc.specialization || '' },
    blocks: parsed.blocks.map((b) => ({ heading: String(b.heading || '').slice(0, 160), content: String(b.content || '') })),
    faqSection: (parsed.faqs && parsed.faqs.length) ? { heading: 'FAQs: Clear Answers for Patients', faqs: parsed.faqs } : undefined,
    status: 'published',
    publishedAt: new Date(),
    sourceMissionId: missionId,
    ...(providedImage ? { featuredImage: { url: providedImage, alt: title } } : {}),
  };

  let id;
  if (existing) {
    await BlogArticle.updateOne({ _id: existing._id }, { $set: fieldsToSet });
    id = existing._id;
  } else {
    const created = await BlogArticle.create(fieldsToSet);
    id = created._id;
  }
  try { await syncBlogLinksToProfile(doctorId); } catch { /* best-effort */ }

  const url = doc.subdomain ? `https://${doc.subdomain}.curago.in/blog/${slug}` : `/blog/${slug}`;
  return { success: true, url, title, id: String(id) };
}
