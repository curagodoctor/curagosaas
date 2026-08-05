// Sitemap for search engines. Lists the public, indexable marketing pages only —
// app/admin/api and auth pages are intentionally excluded (see robots.js).
const BASE = 'https://curago.in';

export default function sitemap() {
  const now = new Date();
  const routes = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/practice-os', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/services', priority: 0.7, changeFrequency: 'monthly' },
  ];
  return routes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
