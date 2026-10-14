/**
 * Turn a queued trend topic into a DRAFT blog article using the double AI-run
 * (architect → writer). System-initiated; costs 1 AI credit per article (guarded).
 * The draft sits for the doctor to review/publish; the topic is marked 'produced'.
 */
import DoctorContentTopic from '@/models/practice-os/DoctorContentTopic';
import BlogArticle from '@/models/BlogArticle';
import Doctor from '@/models/Doctor';
import { nextQueuedTopic } from '@/lib/practice-os/trendTopics';
import { getDoctorProfileContext, getDoctorProfileFields, isProfileReadyForAi } from '@/lib/practice-os/profile';
import { buildBlueprint, blueprintToPrompt } from '@/lib/practice-os/contentArchitect';
import { runMissionAssistant } from '@/lib/practice-os/ai';
import { parseArticleFromMarkdown, stripAssistantPreamble } from '@/lib/practice-os/parseArticle';
import { getRemainingCredits, chargeAiCredits } from '@/lib/practice-os/aiCredits';
import { recordTextUsage } from '@/lib/practice-os/aiUsage';

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

export async function produceNextTrendTopic(doctorId, { scheduleAt = null } = {}) {
  const topic = await nextQueuedTopic(doctorId);
  if (!topic) return { produced: false, reason: 'no-queued-topic' };

  const [profileContext, profileFields] = await Promise.all([getDoctorProfileContext(doctorId), getDoctorProfileFields(doctorId)]);
  if (!isProfileReadyForAi(profileFields)) return { produced: false, reason: 'profile-not-ready' };
  if ((await getRemainingCredits(doctorId)) < 1) return { produced: false, reason: 'no-credits' };

  const title = topic.title;
  const isService = topic.source === 'service';
  // Double AI-run: unique structure for this doctor, then write it grounded.
  const bp = await buildBlueprint({ doctorId, topic: title, specialty: profileFields.specialty, city: profileFields.city || profileFields.location, profileContext });
  const blueprintText = blueprintToPrompt(bp);
  const mission = { category: title, missionText: `Write a patient-education ${isService ? 'service page' : 'article'}: ${title}`, frameworkId: null, aiContext: {} };
  const aiPrompt = isService
    ? `Write a comprehensive, patient-friendly SERVICE PAGE for an Indian ${profileFields.specialty || 'doctor'} about: ${title}. Cover, in clear sections: what the condition/procedure is; common symptoms and when to see a specialist; how it is diagnosed; the treatment/procedure options and the doctor's approach; preparation and recovery (only general, clinically-safe guidance); risks and limitations (honestly); FAQs patients ask; and how to book a consultation. Ground everything in the doctor's profile. Strictly NMC-compliant: no diagnosis, no guaranteed results, no superlatives or comparative claims. Do not invent credentials, statistics or outcomes.`
    : `Write a comprehensive, patient-friendly blog article for an Indian ${profileFields.specialty || 'doctor'} about: ${title}. Ground it in the doctor's profile and keep it NMC-compliant.`;
  const module = { id: `topic_${topic._id}`, title: isService ? 'Service page' : 'Blog article', aiPrompt };

  const result = await runMissionAssistant({ mission, module, userPrompt: module.aiPrompt, profileContext, profileFields, history: [], blueprintText });
  if (!result.success || !result.text) return { produced: false, reason: `assistant-failed: ${result.error || 'empty'}` };
  const content = stripAssistantPreamble(result.text);
  try { await recordTextUsage(doctorId, { model: result.model, promptTokens: result.usage?.promptTokens, completionTokens: result.usage?.completionTokens, totalTokens: result.usage?.totalTokens, source: 'trend-content', label: title.slice(0, 60) }); } catch { /* best-effort */ }
  try { await chargeAiCredits(doctorId, { label: 'trend-content' }); } catch { /* best-effort */ }

  const parsed = parseArticleFromMarkdown(content);
  if (!parsed || !parsed.blocks.length) return { produced: false, reason: 'parse-failed' };

  const doc = await Doctor.findById(doctorId).select('subdomain displayName name specialization').lean();
  const authorName = (profileFields.doctor_name || doc?.displayName || doc?.name || '').trim();
  const blogTitle = String(parsed.title || title).slice(0, 120);
  let slug = slugify(blogTitle) || `topic-${topic._id}`;
  if (await BlogArticle.findOne({ slug }).select('_id').lean()) slug = `${slug}-${String(topic._id).slice(-4)}`;
  const metaDescription = String(parsed.metaDescription || parsed.excerpt || '').slice(0, 160);

  const created = await BlogArticle.create({
    doctorId, title: blogTitle, slug,
    excerpt: metaDescription.slice(0, 300), metaDescription,
    category: String(doc?.specialization || '').slice(0, 60),
    author: { name: authorName, designation: doc?.specialization || '' },
    blocks: parsed.blocks.map((b) => ({ heading: String(b.heading || '').slice(0, 160), content: String(b.content || '') })),
    faqSection: (parsed.faqs && parsed.faqs.length) ? { heading: 'FAQs: Clear Answers for Patients', faqs: parsed.faqs } : undefined,
    // Auto-schedule for a future date, or leave as a draft for review (default).
    ...(scheduleAt ? { status: 'scheduled', scheduledAt: scheduleAt } : { status: 'draft' }),
  });

  await DoctorContentTopic.updateOne({ _id: topic._id }, { $set: { status: 'produced', producedBlogId: created._id } });
  return { produced: true, blogId: String(created._id), title: blogTitle, topicId: String(topic._id), scheduledAt: scheduleAt || null };
}
