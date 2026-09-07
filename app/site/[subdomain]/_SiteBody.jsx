import { resolveThemeId } from '@/lib/themes';
import connectDB from '@/lib/mongodb';
import BlogArticle from '@/models/BlogArticle';
import BookingPage from '@/models/BookingPage';

// Import section components (reuse existing booking page sections)
import HeaderSection from '@/components/booking-page/sections/HeaderSection';
import HeroCarouselSection from '@/components/booking-page/sections/HeroCarouselSection';
import BannerImageSection from '@/components/booking-page/sections/BannerImageSection';
import BenefitsListSection from '@/components/booking-page/sections/BenefitsListSection';
import DoctorProfileSection from '@/components/booking-page/sections/DoctorProfileSection';
import TestimonialsSection from '@/components/booking-page/sections/TestimonialsSection';
import FAQSection from '@/components/booking-page/sections/FAQSection';
import LocationMapSection from '@/components/booking-page/sections/LocationMapSection';
import DiseaseIconsScrollSection from '@/components/booking-page/sections/DiseaseIconsScrollSection';
import CustomTextSection from '@/components/booking-page/sections/CustomTextSection';
import CTAButtonSection from '@/components/booking-page/sections/CTAButtonSection';
import BookingFormSection from '@/components/booking-page/sections/BookingFormSection';
import ClinicInfoSection from '@/components/booking-page/sections/ClinicInfoSection';
import ProfessionalFeesSection from '@/components/booking-page/sections/ProfessionalFeesSection';
import FooterSection from '@/components/booking-page/sections/FooterSection';
import WhatsAppStickyButton from '@/components/booking-page/sections/WhatsAppStickyButton';
import BookNowStickyButton from '@/components/booking-page/sections/BookNowStickyButton';
import FAQChatbot from '@/components/FAQChatbot';

// Section renderer - pass pageSections for header auto-nav
function renderSection(section, doctor, index, allSections = [], extraNavLinks = []) {
  // Spread the config directly so section components receive their props
  const props = {
    key: section._id || index,
    sectionId: section.type, // Use section type as anchor ID for smooth scrolling
    ...section.config, // Spread config fields as individual props
    doctor, // Pass doctor object for components that need it
  };

  switch (section.type) {
    case 'header':
      // Pass all sections to header for auto-generated navigation, plus any
      // cross-page links (e.g. Resources/Blog) that aren't page sections.
      return <HeaderSection {...props} pageSections={allSections} extraNavLinks={extraNavLinks} />;
    case 'hero_carousel':
      return <HeroCarouselSection {...props} />;
    case 'banner_image':
      return <BannerImageSection {...props} />;
    case 'benefits_list':
      return <BenefitsListSection {...props} />;
    case 'doctor_profile':
      return <DoctorProfileSection {...props} />;
    case 'testimonials':
      return <TestimonialsSection {...props} />;
    case 'faqs':
      return <FAQSection {...props} />;
    case 'location_map':
      return <LocationMapSection {...props} />;
    case 'disease_icons_scroll':
      return <DiseaseIconsScrollSection {...props} />;
    case 'custom_text':
      return <CustomTextSection {...props} />;
    case 'cta_button':
      return <CTAButtonSection {...props} />;
    case 'booking_form':
      return <BookingFormSection {...props} doctorId={doctor._id.toString()} subdomain={doctor.subdomain} />;
    case 'clinic_info':
      return <ClinicInfoSection {...props} />;
    case 'professional_fees':
      return <ProfessionalFeesSection {...props} />;
    case 'footer':
      return <FooterSection {...props} />;
    case 'faq_chatbot':
      return <FAQChatbot {...props} />;
    case 'whatsapp_sticky':
      return <WhatsAppStickyButton {...props} />;
    case 'book_now_sticky':
      return <BookNowStickyButton {...props} />;
    default:
      return null;
  }
}

export default async function SiteBody({ doctor, bookingPage }) {
  // `doctor` is expected to be a plain (serialized) object.
  const doctorData = doctor;

  await connectDB();

  // Cross-page navigation: the doctor's OTHER published pages that opt into the
  // navbar. Without this, creating a new page never appears in the nav (the
  // section-based nav only links to anchors within the current page).
  let pageNavLinks = [];
  // The home page owns the SHARED header + footer for the whole site, so branding
  // (logo, nav, footer) is identical on every page — sub-pages no longer each
  // carry their own divergent header/footer.
  let homeSections = bookingPage.sections || [];
  try {
    const pages = await BookingPage.find({ doctorId: doctorData._id, status: 'published' })
      .sort({ createdAt: 1 }) // first-created published page is the homepage ('/')
      .select('slug title displayName showInNavbar displayOrder createdAt')
      .lean();
    // The first-created published page is the homepage ('/') — it's already
    // reachable via the logo, so we DON'T add a redundant self-link for it.
    // Only the doctor's OTHER (secondary) pages become cross-page nav links.
    const homepageId = pages[0]?._id ? String(pages[0]._id) : null;
    pageNavLinks = pages
      .filter((p) => p.showInNavbar && String(p._id) !== homepageId)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map((p) => ({
        text: p.displayName || p.title || p.slug,
        url: `/${p.slug}`,
      }));
    // Load the home page's sections (unless we're already on it) for the shared
    // header/footer.
    if (homepageId && String(bookingPage._id) !== homepageId) {
      const home = await BookingPage.findById(homepageId).select('sections').lean();
      if (home?.sections?.length) homeSections = home.sections;
    }
  } catch {
    pageNavLinks = [];
  }

  // Only surface the Resources/Blog link when this doctor has published at least
  // one article. Scoped by doctorId so nothing from another doctor leaks in.
  let hasBlog = false;
  try {
    hasBlog = (await BlogArticle.countDocuments({
      doctorId: doctorData._id,
      status: 'published',
    })) > 0;
  } catch {
    hasBlog = false;
  }

  const extraNavLinks = [
    ...pageNavLinks,
    ...(hasBlog ? [{ text: 'Resources', url: '/blog' }] : []),
  ];

  // A section renders empty (and should be skipped) when it's an image-only type
  // with no image — the builder can leave behind empty hero_carousel/banner blocks.
  const isEmptySection = (s) => {
    const c = s.config || {};
    if (s.type === 'hero_carousel') return !(Array.isArray(c.images) && c.images.filter(Boolean).length > 0);
    if (s.type === 'banner_image') return !(c.imageUrl || c.image);
    return false;
  };
  // Structural singletons — only ever render the first of each, in page order, so
  // duplicate headers/footers left by the builder don't stack.
  const SINGLETON_TYPES = new Set(['header', 'footer']);

  // Sort once by order, then suppress empties + collapse singletons.
  const visibleSorted = [...bookingPage.sections]
    .filter((s) => s.visible !== false && !isEmptySection(s))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const seenSingleton = new Set();
  const deduped = visibleSorted.filter((s) => {
    if (SINGLETON_TYPES.has(s.type)) {
      if (seenSingleton.has(s.type)) return false;
      seenSingleton.add(s.type);
    }
    return true;
  });

  // Separate sticky buttons from regular sections, keeping only the FIRST of each
  // sticky type (stacked duplicate "Book Now" / WhatsApp buttons are a builder bug).
  const regularSections = deduped.filter((s) => !['whatsapp_sticky', 'book_now_sticky'].includes(s.type));
  const seenSticky = new Set();
  const stickyButtons = deduped.filter((s) => {
    if (!['whatsapp_sticky', 'book_now_sticky'].includes(s.type)) return false;
    if (seenSticky.has(s.type)) return false;
    seenSticky.add(s.type);
    return true;
  });

  // Get the theme for this booking page
  const themeId = resolveThemeId(bookingPage);

  // The header is now position:sticky (in normal flow), so it reserves its own
  // height and never overlaps the hero — no manual top spacer needed.

  // --- Shared header + footer (from the HOME page) ---------------------------
  const brandName = doctorData.displayName || doctorData.name || 'Clinic';
  const DEFAULT_HEADER = {
    type: 'header', order: -1, visible: true,
    config: { showNavigation: true, navMode: 'auto', autoNavConfig: { useSmartGroups: true, excludeSections: [], customLabels: {} }, ctaButton: { text: 'Book Appointment', url: '#booking_form', show: true }, backgroundColor: 'white', sticky: true },
  };
  const DEFAULT_FOOTER = {
    type: 'footer', order: 9999, visible: true,
    config: { companyName: brandName, showQuickLinks: true },
  };
  const sharedHeader = homeSections.find((s) => s.type === 'header' && s.visible !== false) || DEFAULT_HEADER;
  const sharedFooter = homeSections.find((s) => s.type === 'footer' && s.visible !== false) || DEFAULT_FOOTER;
  // Drive the header's auto-nav from the HOME page's content sections so the nav
  // is identical on every page (missing-anchor clicks route to the home section).
  const homeNavSections = homeSections.filter(
    (s) => s.visible !== false && !['header', 'footer', 'whatsapp_sticky', 'book_now_sticky'].includes(s.type)
  );
  // The current page's own header/footer are ignored — the shared ones win.
  const contentSections = regularSections
    .filter((s) => !['header', 'footer'].includes(s.type))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="min-h-screen" data-theme={themeId}>
      {/* Shared site header (from the home page) */}
      {renderSection(sharedHeader, doctorData, 'shared-header', homeNavSections, extraNavLinks)}

      {/* This page's content sections */}
      {contentSections.map((section, index) => renderSection(section, doctorData, index, homeNavSections, extraNavLinks))}

      {/* Shared site footer (from the home page) */}
      {renderSection(sharedFooter, doctorData, 'shared-footer', homeNavSections, extraNavLinks)}

      {/* Render sticky buttons */}
      {stickyButtons.map((section, index) => {
        if (section.type === 'whatsapp_sticky') {
          // Fall back to the doctor's own WhatsApp number when the section
          // hasn't been given one. The component normalizes the number.
          return (
            <WhatsAppStickyButton
              key={`sticky-${index}`}
              {...section.config}
              phoneNumber={section.config?.phoneNumber || doctorData.whatsappNumber || ''}
            />
          );
        }
        if (section.type === 'book_now_sticky') {
          return <BookNowStickyButton key={`sticky-${index}`} {...section.config} />;
        }
        return null;
      })}

      {/* Default WhatsApp button if doctor has WhatsApp but no sticky button configured */}
      {doctorData.whatsappNumber && !stickyButtons.some(s => s.type === 'whatsapp_sticky') && (
        <WhatsAppStickyButton
          phoneNumber={doctorData.whatsappNumber}
          message={`Hi ${doctorData.displayName || doctorData.name}, I would like to book an appointment.`}
          position="bottom-right"
        />
      )}
    </div>
  );
}
