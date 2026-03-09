// Section Components (will be created/imported)
import HeroCarouselSection from './sections/HeroCarouselSection';
import BannerImageSection from './sections/BannerImageSection';
import BenefitsListSection from './sections/BenefitsListSection';
import DoctorProfileSection from './sections/DoctorProfileSection';
import TestimonialsSection from './sections/TestimonialsSection';
import FAQSection from './sections/FAQSection';
import LocationMapSection from './sections/LocationMapSection';
import DiseaseIconsScrollSection from './sections/DiseaseIconsScrollSection';
import CustomTextSection from './sections/CustomTextSection';
import CTAButtonSection from './sections/CTAButtonSection';
import BookingFormSection from './sections/BookingFormSection';
import ClinicInfoSection from './sections/ClinicInfoSection';
import FooterSection from './sections/FooterSection';
import WhatsAppStickyButton from './sections/WhatsAppStickyButton';
import BookNowStickyButton from './sections/BookNowStickyButton';
import ProfessionalFeesSection from './sections/ProfessionalFeesSection';
import FAQChatbot from '@/components/FAQChatbot';

const SECTION_COMPONENTS = {
  hero_carousel: HeroCarouselSection,
  banner_image: BannerImageSection,
  benefits_list: BenefitsListSection,
  doctor_profile: DoctorProfileSection,
  testimonials: TestimonialsSection,
  faqs: FAQSection,
  location_map: LocationMapSection,
  disease_icons_scroll: DiseaseIconsScrollSection,
  custom_text: CustomTextSection,
  cta_button: CTAButtonSection,
  booking_form: BookingFormSection,
  clinic_info: ClinicInfoSection,
  footer: FooterSection,
  whatsapp_sticky: WhatsAppStickyButton,
  book_now_sticky: BookNowStickyButton,
  professional_fees: ProfessionalFeesSection,
  faq_chatbot: FAQChatbot,
};

export default function SectionRenderer({ section, trackingContext, consultationFee, bookingFee }) {
  if (!section || !section.visible) {
    return null;
  }

  const Component = SECTION_COMPONENTS[section.type];

  if (!Component) {
    console.warn(`Unknown section type: ${section.type}`);
    return null;
  }

  // Pass config, tracking context, and fees to component
  return (
    <Component
      {...section.config}
      trackingContext={trackingContext}
      consultationFee={consultationFee}
      bookingFee={bookingFee}
    />
  );
}
