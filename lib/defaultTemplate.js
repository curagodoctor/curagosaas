/**
 * Default booking-page template for new doctor websites.
 *
 * Returns an ordered array of sections that render out of the box and stay
 * fully editable/reorderable in the page builder. Every `type` here MUST exist
 * in the renderer switch (app/site/[subdomain]/_SiteBody.jsx) and in the
 * BookingPage model's section enum. The section shape matches what the editor
 * produces: { type, order, visible, config }.
 *
 * Config prop names mirror each section component's props and the editor's
 * SECTION_TYPES defaultConfig, so seeded pages open cleanly in the builder.
 *
 * Content that can't be known for a brand-new doctor (patient testimonials,
 * clinic address, map location) is left empty on purpose — those sections act
 * as editable scaffolds and simply don't render until the doctor fills them,
 * rather than inventing fake content.
 */

export function buildDefaultSections(doctor = {}) {
  const name = doctor.displayName || doctor.name || 'Your Clinic';
  const specialization = doctor.specialization || '';
  const qualification = doctor.qualification || '';
  const bio = doctor.bio || '';
  const phone = doctor.phone || '';
  const whatsapp = doctor.whatsappNumber || doctor.phone || '';
  const email = doctor.email || '';
  const profileImage = doctor.profileImage || '';

  const credentials = [qualification].filter(Boolean);

  // Hero carousel seeds a slide from the doctor's profile image when available.
  // With no image the section renders nothing but remains editable so the
  // doctor can add photos from the builder.
  const heroImages = profileImage
    ? [{ url: profileImage, alt: name, caption: '' }]
    : [];

  const aboutContent =
    bio ||
    `Welcome to ${name}. Book an appointment to consult with us — we look ` +
      `forward to caring for you.`;

  const sections = [
    {
      type: 'header',
      order: 0,
      visible: true,
      config: {
        logoUrl: '',
        logoText: '',
        showNavigation: true,
        navMode: 'auto',
        autoNavConfig: {
          useSmartGroups: true,
          excludeSections: [],
          customLabels: {},
        },
        navLinks: [
          { text: 'Home', url: '#' },
          { text: 'About', url: '#doctor_profile' },
          { text: 'Book Now', url: '#booking_form' },
        ],
        ctaButton: { text: 'Book Appointment', url: '#booking_form', show: true },
        backgroundColor: 'white',
        sticky: true,
      },
    },
    {
      type: 'hero_carousel',
      order: 1,
      visible: true,
      config: {
        images: heroImages,
        autoPlaySpeed: 3000,
        showIndicators: true,
        showDoctorCredentials: Boolean(specialization || credentials.length),
        doctorName: name,
        doctorTitle: specialization,
        doctorCredentials: credentials,
      },
    },
    {
      type: 'doctor_profile',
      order: 2,
      visible: true,
      config: {
        title: `About ${name}`,
        content: aboutContent,
        imageUrl: profileImage,
        credentials,
        layout: 'left',
      },
    },
    {
      type: 'benefits_list',
      order: 3,
      visible: true,
      config: {
        title: 'Our Services',
        subtitle: specialization
          ? `Comprehensive ${specialization} care`
          : 'Comprehensive care for you and your family',
        items: [
          {
            icon: '🩺',
            title: 'Personalised Consultations',
            description:
              'Unhurried appointments with a treatment plan tailored to your needs.',
          },
          {
            icon: '📅',
            title: 'Easy Online Booking',
            description:
              'Reserve a convenient slot in a few taps and get instant confirmation.',
          },
          {
            icon: '💬',
            title: 'Support on WhatsApp',
            description:
              'Reach the clinic on WhatsApp for reschedules and quick questions.',
          },
        ],
      },
    },
    {
      type: 'testimonials',
      order: 4,
      visible: true,
      config: {
        title: 'What Our Patients Say',
        subtitle: '',
        testimonials: [],
        layout: 'grid',
      },
    },
    {
      type: 'faqs',
      order: 5,
      visible: true,
      config: {
        title: 'Frequently Asked Questions',
        subtitle: '',
        faqs: [
          {
            question: 'How do I book an appointment?',
            answer:
              'Use the booking form on this page to pick a date and time. ' +
              'You will receive a confirmation on WhatsApp and SMS.',
          },
          {
            question: 'Can I reschedule my appointment?',
            answer:
              'Yes. Message the clinic on WhatsApp at least 2 hours before your ' +
              'slot and we will help you reschedule.',
          },
          {
            question: 'What should I bring to my visit?',
            answer:
              'Please carry any previous prescriptions, reports, and a list of ' +
              'medicines you are currently taking.',
          },
        ],
        allowMultipleOpen: false,
      },
    },
    {
      type: 'location_map',
      order: 6,
      visible: true,
      config: {
        title: 'Our Location',
        locations: [],
        showDirectionsButton: true,
      },
    },
    {
      type: 'clinic_info',
      order: 7,
      visible: true,
      config: {
        title: 'Our Clinic',
        clinics: [],
        showConsultationInfo: true,
      },
    },
    {
      type: 'booking_form',
      order: 8,
      visible: true,
      config: {
        customTitle: '',
        customSubtitle: '',
        paymentMode: 'no_payment',
      },
    },
    {
      type: 'footer',
      order: 9,
      visible: true,
      config: {
        companyName: name,
        tagline: specialization || 'Your Health, Our Priority',
        address: '',
        phone,
        email,
        showSocialLinks: false,
        facebookUrl: '',
        instagramUrl: '',
        twitterUrl: '',
        linkedinUrl: '',
        showQuickLinks: true,
        quickLinks: [
          { text: 'Home', url: '#' },
          { text: 'About', url: '#doctor_profile' },
          { text: 'Book Now', url: '#booking_form' },
        ],
        copyrightText: '',
        backgroundColor: 'primary',
      },
    },
    {
      type: 'whatsapp_sticky',
      order: 10,
      visible: true,
      config: {
        phoneNumber: whatsapp,
        message: `Hi ${name}, I would like to book an appointment.`,
        tooltipText: 'Chat with us',
        position: 'bottom-right',
        backgroundColor: '#25D366',
      },
    },
  ];

  return sections;
}

export default buildDefaultSections;
