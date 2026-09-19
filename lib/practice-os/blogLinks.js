import BlogArticle from '@/models/BlogArticle';
import Doctor from '@/models/Doctor';
import PracticeOsProfile from '@/models/practice-os/PracticeOsProfile';
import { primaryBaseUrl } from '@/lib/primaryDomain';

// §10 — central blog-link registry.
//
// Rather than store links in a second place that can drift, we DERIVE the
// registry from the doctor's published articles: each article carries a
// diseaseCluster + pageType, and its public URL is built from the doctor's
// primary domain. The result powers automatic internal linking and lets page
// links be reused in GBP posts and other content via template variables like
//   {{disease_cluster_gallbladder_stones_treatment_page}}

function slugToken(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// Full registry: { [cluster]: { [pageType]: { url, title, slug } } } + a flat
// variables map for content injection.
export async function getBlogLinkRegistry(doctorId) {
  const [doctor, articles] = await Promise.all([
    Doctor.findById(doctorId).select('subdomain customDomain customDomainVerified').lean(),
    BlogArticle.find({ doctorId, status: 'published', diseaseCluster: { $ne: '' } })
      .select('title slug diseaseCluster pageType publishedAt').sort({ publishedAt: 1 }).lean(),
  ]);
  const base = doctor ? primaryBaseUrl(doctor) : null;

  const clusters = {};
  const variables = {};
  for (const a of articles) {
    const cluster = a.diseaseCluster;
    const type = a.pageType || 'page';
    const url = base ? `${base}/blog/${a.slug}` : `/blog/${a.slug}`;
    clusters[cluster] = clusters[cluster] || {};
    // First published page of a (cluster, type) wins the canonical slot.
    if (!clusters[cluster][type]) {
      clusters[cluster][type] = { url, title: a.title, slug: a.slug };
      variables[`disease_cluster_${slugToken(cluster)}_${slugToken(type)}_page`] = url;
    }
  }
  return { clusters, variables };
}

// Mirror the derived blog-page links into the doctor's PracticeOsProfile so they
// live in the profile section (visible + durable) and resolve as placeholders in
// any content. The registry stays the source of truth — this just keeps a synced
// copy under profile.variables. Call it after a page is published/unpublished.
// Best-effort: never throw into the publish path.
export async function syncBlogLinksToProfile(doctorId) {
  try {
    const { variables } = await getBlogLinkRegistry(doctorId);
    const profile = await PracticeOsProfile.findOne({ doctorId });
    if (!profile) return;
    profile.variables = profile.variables || {};
    // Drop stale blog-link vars, then write the current set (so unpublished pages
    // stop resolving instead of pointing at a dead URL).
    for (const key of Object.keys(profile.variables)) {
      if (key.startsWith('disease_cluster_')) delete profile.variables[key];
    }
    Object.assign(profile.variables, variables);
    profile.markModified('variables');
    await profile.save();
  } catch { /* best-effort — publishing must not fail on link sync */ }
}

// A "Related reading" HTML block linking the OTHER published pages in the same
// cluster — appended to a new article so internal linking happens automatically.
export async function relatedReadingBlock(doctorId, cluster, excludeSlug = '') {
  if (!cluster) return null;
  const { clusters } = await getBlogLinkRegistry(doctorId);
  const entries = Object.values(clusters[cluster] || {}).filter((e) => e.slug !== excludeSlug);
  if (!entries.length) return null;
  const items = entries.map((e) => `<li><a href="${e.url}">${e.title}</a></li>`).join('');
  return { heading: 'Related reading', content: `<ul>${items}</ul>` };
}
