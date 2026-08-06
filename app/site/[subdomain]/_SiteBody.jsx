import { resolveThemeId } from '@/lib/themes';

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
function renderSection(section, doctor, index, allSections = []) {
  // Spread the config directly so section components receive their props
  const props = {
    key: section._id || index,
    sectionId: section.type, // Use section type as anchor ID for smooth scrolling
    ...section.config, // Spread config fields as individual props
    doctor, // Pass doctor object for components that need it
  };

  switch (section.type) {
    case 'header':
      // Pass all sections to header for auto-generated navigation
      return <HeaderSection {...props} pageSections={allSections} />;
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

export default function SiteBody({ doctor, bookingPage }) {
  // `doctor` is expected to be a plain (serialized) object.
  const doctorData = doctor;

  // Separate sticky buttons from regular sections
  const regularSections = bookingPage.sections.filter(
    s => s.visible !== false && !['whatsapp_sticky', 'book_now_sticky'].includes(s.type)
  );
  const stickyButtons = bookingPage.sections.filter(
    s => s.visible !== false && ['whatsapp_sticky', 'book_now_sticky'].includes(s.type)
  );

  // Get the theme for this booking page
  const themeId = resolveThemeId(bookingPage);

  // A fixed/sticky header overlaps the top of the page. Reserve space for it at
  // the very top so the first section (hero/banner) isn't hidden behind the
  // navbar — regardless of where the header sits in the section order.
  const hasStickyHeader = regularSections.some(
    (s) => s.type === 'header' && s.config?.sticky !== false
  );

  return (
    <div className="min-h-screen" data-theme={themeId}>
      {/* Reserve space for the fixed header so the hero isn't clipped by it */}
      {hasStickyHeader && <div className="h-16 md:h-20" />}

      {/* Render regular sections */}
      {regularSections
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((section, index) => renderSection(section, doctorData, index, regularSections))}

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
