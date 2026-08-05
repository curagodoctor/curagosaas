// robots.txt — allow crawling of public marketing pages, block the app,
// admin/platform, API and auth surfaces, and point crawlers at the sitemap.
const BASE = 'https://curago.in';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/app/',
          '/admin/',
          '/platform-admin/',
          '/reputation-manager/',
          '/seo/',
          '/api/',
          '/login',
          '/signup',
          '/reset-password',
          '/verify-email',
          '/payment-callback',
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
