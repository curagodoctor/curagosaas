import { headers } from 'next/headers';

// Views were inflated because every server render incremented the counter —
// including search-engine crawlers, social link-unfurlers, uptime monitors, and
// Next.js route prefetches (a hovered link bumps the count without a real visit).
// This filters those out so "website visits" reflects actual human page loads.
const BOT_RE = /bot|crawl|spider|slurp|bing|google|baidu|yandex|duckduck|facebookexternalhit|facebot|whatsapp|telegram|twitter|linkedin|embedly|preview|monitor|uptime|pingdom|curl|wget|python-requests|python-httpx|axios|node-fetch|go-http|java\/|okhttp|headless|phantom|puppeteer|playwright|lighthouse|pagespeed|gtmetrix|ahrefs|semrush|mj12|dotbot/i;

// Call from a server component or route handler before $inc-ing a view.
export async function shouldCountView() {
  try {
    const h = await headers();
    const ua = h.get('user-agent') || '';
    if (!ua || BOT_RE.test(ua)) return false;
    // Next.js prefetch / RSC-only requests — not a real page view.
    if (h.get('next-router-prefetch') || h.get('x-middleware-prefetch') || (h.get('purpose') || h.get('sec-purpose') || '').includes('prefetch')) return false;
    return true;
  } catch {
    return true; // if headers aren't available, don't silently drop real views
  }
}
