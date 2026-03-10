import { notFound } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import BookingPage from '@/models/BookingPage';

// Import section components (reuse existing booking page sections)
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

// Section renderer
function renderSection(section, doctor, index) {
  const props = {
    key: section._id || index,
    config: section.config,
    doctor,
  };

  switch (section.type) {
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
      return <BookingFormSection {...props} slug={doctor.subdomain} />;
    case 'clinic_info':
      return <ClinicInfoSection {...props} />;
    case 'professional_fees':
      return <ProfessionalFeesSection {...props} />;
    case 'footer':
      return <FooterSection {...props} />;
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

  // If no page exists yet, show a basic page
  if (!bookingPage || !bookingPage.sections || bookingPage.sections.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50">
        {/* Simple default page */}
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-24 h-24 bg-emerald-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            {doctor.profileImage ? (
              <img
                src={doctor.profileImage}
                alt={doctor.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <span className="text-4xl">👨‍⚕️</span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {doctor.displayName || doctor.name}
          </h1>
          {doctor.specialization && (
            <p className="text-lg text-emerald-600 mb-2">{doctor.specialization}</p>
          )}
          {doctor.qualification && (
            <p className="text-gray-600 mb-6">{doctor.qualification}</p>
          )}
          {doctor.bio && (
            <p className="text-gray-700 max-w-2xl mx-auto mb-8">{doctor.bio}</p>
          )}

          {doctor.whatsappNumber && (
            <a
              href={`https://wa.me/91${doctor.whatsappNumber}?text=${encodeURIComponent('Hi, I would like to book an appointment.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Book via WhatsApp
            </a>
          )}

          <p className="mt-8 text-sm text-gray-500">
            Powered by <span className="text-emerald-600 font-medium">Curago</span>
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

  return (
    <div className="min-h-screen">
      {/* Render regular sections */}
      {regularSections
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((section, index) => renderSection(section, doctorData, index))}

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
