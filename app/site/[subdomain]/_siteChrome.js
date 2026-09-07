import BookingPage from '@/models/BookingPage';
import BlogArticle from '@/models/BlogArticle';
import { resolveThemeId } from '@/lib/themes';

// Shared site "chrome": the header + footer config (from the HOME page) and the
// cross-page nav links. Used by BOTH the page renderer and the blog routes so a
// doctor's branding (logo, nav, footer) is identical everywhere.
export async function getSiteChrome(doctor, { currentPageId = null, currentSections = null } = {}) {
  const doctorId = doctor._id;
  let pageNavLinks = [];
  let homeSections = [];
  let themeId = 'default';

  try {
    const pages = await BookingPage.find({ doctorId, status: 'published' })
      .sort({ createdAt: 1 })
      .select('slug title displayName showInNavbar displayOrder createdAt')
      .lean();
    const homepageId = pages[0]?._id ? String(pages[0]._id) : null;
    pageNavLinks = pages
      .filter((p) => p.showInNavbar && String(p._id) !== homepageId)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map((p) => ({ text: p.displayName || p.title || p.slug, url: `/${p.slug}` }));

    if (homepageId) {
      const home = await BookingPage.findById(homepageId).select('sections theme colorScheme').lean();
      if (home?.sections?.length) homeSections = home.sections;
      if (home) themeId = resolveThemeId(home);
    }
  } catch { /* ignore */ }

  let hasBlog = false;
  try { hasBlog = (await BlogArticle.countDocuments({ doctorId, status: 'published' })) > 0; } catch { /* ignore */ }
  const extraNavLinks = [...pageNavLinks, ...(hasBlog ? [{ text: 'Resources', url: '/blog' }] : [])];

  const brandName = doctor.displayName || doctor.name || 'Clinic';
  const DEFAULT_HEADER = {
    type: 'header', config: { showNavigation: true, navMode: 'auto', autoNavConfig: { useSmartGroups: true, excludeSections: [], customLabels: {} }, ctaButton: { text: 'Book Appointment', url: '#booking_form', show: true }, backgroundColor: 'white', sticky: true },
  };
  const DEFAULT_FOOTER = { type: 'footer', config: { companyName: brandName, showQuickLinks: true } };

  const header = homeSections.find((s) => s.type === 'header' && s.visible !== false) || DEFAULT_HEADER;
  const footer = homeSections.find((s) => s.type === 'footer' && s.visible !== false) || DEFAULT_FOOTER;
  const navSections = homeSections.filter(
    (s) => s.visible !== false && !['header', 'footer', 'whatsapp_sticky', 'book_now_sticky'].includes(s.type)
  );

  return { header, footer, navSections, extraNavLinks, homeSections, themeId };
}
