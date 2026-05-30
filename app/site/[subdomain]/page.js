import { notFound } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import BookingPage from '@/models/BookingPage';
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

// Generate metadata
export async function generateMetadata({ params }) {
  const { subdomain } = await params;

  try {
    await connectDB();

    const doctor = await Doctor.findOne({
      subdomain: subdomain.toLowerCase(),
      isActive: true,
    }).lean();

    if (!doctor) {
      return {
        title: 'Site Not Found',
      };
    }

    const bookingPage = await BookingPage.findOne({
      doctorId: doctor._id,
      status: 'published',
    }).lean();

    return {
      title: bookingPage?.title || `${doctor.displayName || doctor.name} - Book Appointment`,
      description: bookingPage?.metaDescription || `Book an appointment with ${doctor.displayName || doctor.name}`,
      openGraph: {
        title: bookingPage?.title || doctor.displayName || doctor.name,
        description: bookingPage?.metaDescription || `Book an appointment with ${doctor.displayName || doctor.name}`,
        images: bookingPage?.ogImage ? [bookingPage.ogImage] : [],
      },
    };
  } catch {
    return {
      title: 'Curago',
    };
  }
}

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

export default async function SubdomainSitePage({ params }) {
  const { subdomain } = await params;

  await connectDB();

  // Find doctor by subdomain
  const doctor = await Doctor.findOne({
    subdomain: subdomain.toLowerCase(),
    isActive: true,
    isEmailVerified: true,
  }).select('-password -emailOTP -emailOTPExpiry').lean();

  if (!doctor) {
    notFound();
  }

  // Get the main booking page for this doctor
  const bookingPage = await BookingPage.findOne({
    doctorId: doctor._id,
    status: 'published',
  }).sort({ createdAt: 1 }).lean();

  // Increment views
  if (bookingPage) {
    await BookingPage.findByIdAndUpdate(bookingPage._id, {
      $inc: { views: 1 }
    });
  }

  // If no page exists yet, show a plain default page
  if (!bookingPage || !bookingPage.sections || bookingPage.sections.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-[#096b17]/10 rounded-full mx-auto mb-6 flex items-center justify-center">
            {doctor.profileImage ? (
              <img
                src={doctor.profileImage}
                alt={doctor.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-[#096b17]">
                {(doctor.displayName || doctor.name)?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {doctor.displayName || doctor.name}&apos;s Clinic
          </h1>

          <a
            href={`tel:+91${doctor.phone}`}
            className="inline-flex items-center gap-2 mt-6 bg-[#096b17] hover:bg-[#075110] text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Contact Clinic
          </a>
          <p className="mt-2 text-gray-500">{doctor.phone}</p>

          <p className="mt-8 text-sm text-gray-400">
            Powered by <span className="text-[#096b17] font-medium">CuraGo</span>
          </p>
        </div>
      </div>
    );
  }

  // Separate sticky buttons from regular sections
  const regularSections = bookingPage.sections.filter(
    s => s.visible !== false && !['whatsapp_sticky', 'book_now_sticky'].includes(s.type)
  );
  const stickyButtons = bookingPage.sections.filter(
    s => s.visible !== false && ['whatsapp_sticky', 'book_now_sticky'].includes(s.type)
  );

  // Convert doctor to plain object for client components
  const doctorData = JSON.parse(JSON.stringify(doctor));

  // Get the theme for this booking page
  const themeId = resolveThemeId(bookingPage);

  return (
    <div className="min-h-screen" data-theme={themeId}>
      {/* Render regular sections */}
      {regularSections
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((section, index) => renderSection(section, doctorData, index, regularSections))}

      {/* Render sticky buttons */}
      {stickyButtons.map((section, index) => {
        if (section.type === 'whatsapp_sticky') {
          // Use doctor's WhatsApp number if not set in config
          const config = {
            ...section.config,
            phoneNumber: section.config?.phoneNumber || (doctorData.whatsappNumber ? `91${doctorData.whatsappNumber}` : ''),
          };
          return <WhatsAppStickyButton key={`sticky-${index}`} config={config} />;
        }
        if (section.type === 'book_now_sticky') {
          return <BookNowStickyButton key={`sticky-${index}`} config={section.config} />;
        }
        return null;
      })}

      {/* Default WhatsApp button if doctor has WhatsApp but no sticky button configured */}
      {doctorData.whatsappNumber && !stickyButtons.some(s => s.type === 'whatsapp_sticky') && (
        <WhatsAppStickyButton
          config={{
            phoneNumber: `91${doctorData.whatsappNumber}`,
            message: `Hi ${doctorData.displayName || doctorData.name}, I would like to book an appointment.`,
            position: 'bottom-right',
          }}
        />
      )}
    </div>
  );
}
