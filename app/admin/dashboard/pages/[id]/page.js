"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useModal } from "@/contexts/ModalContext";

// Import config forms
import HeroCarouselConfig from "@/components/admin/booking-pages/config-forms/HeroCarouselConfig";
import BannerImageConfig from "@/components/admin/booking-pages/config-forms/BannerImageConfig";
import BenefitsListConfig from "@/components/admin/booking-pages/config-forms/BenefitsListConfig";
import DoctorProfileConfig from "@/components/admin/booking-pages/config-forms/DoctorProfileConfig";
import TestimonialsConfig from "@/components/admin/booking-pages/config-forms/TestimonialsConfig";
import FAQConfig from "@/components/admin/booking-pages/config-forms/FAQConfig";
import LocationMapConfig from "@/components/admin/booking-pages/config-forms/LocationMapConfig";
import DiseaseIconsScrollConfig from "@/components/admin/booking-pages/config-forms/DiseaseIconsScrollConfig";
import CustomTextConfig from "@/components/admin/booking-pages/config-forms/CustomTextConfig";
import CTAButtonConfig from "@/components/admin/booking-pages/config-forms/CTAButtonConfig";
import BookingFormConfig from "@/components/admin/booking-pages/config-forms/BookingFormConfig";
import ClinicInfoConfig from "@/components/admin/booking-pages/config-forms/ClinicInfoConfig";
import FooterConfig from "@/components/admin/booking-pages/config-forms/FooterConfig";
import WhatsAppStickyButtonConfig from "@/components/admin/booking-pages/config-forms/WhatsAppStickyButtonConfig";
import BookNowStickyButtonConfig from "@/components/admin/booking-pages/config-forms/BookNowStickyButtonConfig";
import ProfessionalFeesConfig from "@/components/admin/booking-pages/config-forms/ProfessionalFeesConfig";
import ChatbotConfig from "@/components/admin/booking-pages/config-forms/ChatbotConfig";

// Section type definitions with metadata and SVG icons
const SECTION_TYPES = [
  {
    type: "hero_carousel",
    name: "Hero Carousel",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    description: "Auto-playing image carousel",
    defaultConfig: {
      images: [],
      autoPlaySpeed: 3000,
      showIndicators: true,
    },
  },
  {
    type: "banner_image",
    name: "Banner Image",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    description: "Full-width image banner",
    defaultConfig: {
      imageUrl: "",
      title: "",
      subtitle: "",
      alignment: "center",
      overlayOpacity: 0.4,
    },
  },
  {
    type: "benefits_list",
    name: "Benefits List",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: "Grid of features/benefits",
    defaultConfig: {
      title: "Why Choose Us",
      subtitle: "",
      items: [],
    },
  },
  {
    type: "doctor_profile",
    name: "Doctor Profile",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    description: "About doctor section",
    defaultConfig: {
      title: "About Dr. Yuvaraj T",
      content: "",
      imageUrl: "",
      credentials: [],
      layout: "left",
    },
  },
  {
    type: "testimonials",
    name: "Testimonials",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    description: "Patient testimonials",
    defaultConfig: {
      title: "What Our Patients Say",
      subtitle: "",
      testimonials: [],
      layout: "grid",
    },
  },
  {
    type: "faqs",
    name: "FAQs",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: "FAQ accordion",
    defaultConfig: {
      title: "Frequently Asked Questions",
      subtitle: "",
      faqs: [],
      allowMultipleOpen: false,
    },
  },
  {
    type: "location_map",
    name: "Location Map",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    description: "Google Maps embed",
    defaultConfig: {
      title: "Visit Our Clinic",
      address: "SRV Hospital, Tilak Nagar, Chembur, Mumbai",
      mapUrl: "",
      showDirectionsButton: true,
    },
  },
  {
    type: "disease_icons_scroll",
    name: "Disease Icons Scroll",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    description: "Scrolling disease icons",
    defaultConfig: {
      icons: [],
      speed: "medium",
    },
  },
  {
    type: "custom_text",
    name: "Custom Text",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
    description: "Rich text content",
    defaultConfig: {
      title: "",
      content: "",
      alignment: "left",
      backgroundColor: "white",
      maxWidth: "4xl",
      padding: "normal",
    },
  },
  {
    type: "cta_button",
    name: "CTA Button",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
    description: "Call-to-action button",
    defaultConfig: {
      title: "",
      subtitle: "",
      buttonText: "Book Now",
      buttonLink: "#booking",
      buttonStyle: "primary",
      alignment: "center",
      backgroundColor: "beige",
      size: "large",
      showIcon: true,
    },
  },
  {
    type: "booking_form",
    name: "Booking Form",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    description: "Appointment booking form",
    defaultConfig: {
      customTitle: "",
      customSubtitle: "",
    },
  },
  {
    type: "clinic_info",
    name: "Clinic Info",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    description: "Clinic location and consultation info",
    defaultConfig: {
      title: "Find Us in Mumbai",
      address: "SRV Hospital, Tilak Nagar, Chembur.",
      locationLink: "https://maps.google.com/?q=SRV+Hospital+Tilak+Nagar+Chembur",
      showConsultationInfo: true,
    },
  },
  {
    type: "professional_fees",
    name: "Professional Fees",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: "Consultation fees table",
    defaultConfig: {
      title: "Professional Consultation Fees",
      subtitle: "",
      fees: [
        { serviceType: "In-Clinic (Offline)", newConsultation: "1000", followUp: "800" },
        { serviceType: "Video (Online)", newConsultation: "1000", followUp: "800" },
      ],
      showCurrency: true,
      currency: "₹",
      backgroundColor: "white",
    },
  },
  {
    type: "footer",
    name: "Footer",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
    description: "Page footer with contact and links",
    defaultConfig: {
      companyName: "CuraGo",
      tagline: "Your Health, Our Priority",
      address: "SRV Hospital, Tilak Nagar, Chembur, Mumbai",
      phone: "+91 7021227203",
      email: "team@curago.in",
      showSocialLinks: false,
      facebookUrl: "",
      instagramUrl: "",
      twitterUrl: "",
      linkedinUrl: "",
      showQuickLinks: true,
      quickLinks: [
        { text: "Home", url: "/" },
        { text: "Book Consultation", url: "#booking" },
        { text: "About", url: "#about" },
      ],
      copyrightText: "",
      backgroundColor: "primary",
    },
  },
  {
    type: "whatsapp_sticky",
    name: "WhatsApp Sticky Button",
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    ),
    description: "Floating WhatsApp contact button",
    defaultConfig: {
      phoneNumber: "917021227203",
      message: "Hi, I need help with my booking on CuraGo.",
      tooltipText: "Chat with us",
      position: "bottom-right",
      backgroundColor: "#25D366",
    },
  },
  {
    type: "book_now_sticky",
    name: "Book Now Sticky Button",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    description: "Floating Book Now CTA button",
    defaultConfig: {
      buttonText: "Book Now",
      buttonLink: "#booking",
      tooltipText: "Book your appointment",
      position: "bottom-left",
      backgroundColor: "#1e40af",
      textColor: "#ffffff",
    },
  },
  {
    type: "faq_chatbot",
    name: "FAQ Chatbot",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    description: "Floating FAQ chatbot with clickable questions",
    defaultConfig: {
      enabled: true,
      botName: "CuraGo Assistant",
      welcomeMessage: "Hi! I'm here to help you with any questions about our consultation services. What would you like to know?",
      primaryColor: "#059669",
      position: "right",
      categories: [],
    },
  },
];

export default function PageBuilderEditor() {
  const params = useParams();
  const { id } = params;
  const { showConfirm } = useModal();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");

  // Page data
  const [pageData, setPageData] = useState({
    slug: "",
    title: "",
    metaDescription: "",
    metaKeywords: [],
    status: "draft",
    sections: [],
    consultationFee: 1000,
    bookingFee: 150,
    // Display fields for navbar and clinic cards
    category: "other",
    displayName: "",
    shortDescription: "",
    displayOrder: 0,
    iconType: "custom",
    colorScheme: "blue",
    showInNavbar: false,
  });

  // UI state
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(null);
  const [showSectionPalette] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);

  // Fetch page data
  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/booking-pages/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch page");
        }

        const data = await response.json();
        setPageData(data.page);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPage();
  }, [id]);

  // Save page
  const savePage = async (publishNow = false) => {
    try {
      setSaving(true);
      setSaveStatus(publishNow ? "Publishing..." : "Saving...");

      const dataToSave = {
        ...pageData,
        status: publishNow ? "published" : pageData.status,
        publishedAt: publishNow && !pageData.publishedAt ? new Date().toISOString() : pageData.publishedAt,
      };

      const response = await fetch(`/api/admin/booking-pages/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        throw new Error("Failed to save page");
      }

      const data = await response.json();
      setPageData(data.page);
      setSaveStatus(publishNow ? "Published!" : "Saved!");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      setError(err.message);
      setSaveStatus("");
    } finally {
      setSaving(false);
    }
  };

  // Add section
  const addSection = (sectionType) => {
    const sectionDef = SECTION_TYPES.find((s) => s.type === sectionType);
    if (!sectionDef) return;

    const newSection = {
      _id: `temp_${Date.now()}`,
      type: sectionType,
      order: pageData.sections.length,
      visible: true,
      config: { ...sectionDef.defaultConfig },
    };

    setPageData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));

    // Select the new section
    setSelectedSectionIndex(pageData.sections.length);
  };

  // Move section up
  const moveSectionUp = (index) => {
    if (index === 0) return;

    const newSections = [...pageData.sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];

    // Update order values
    newSections.forEach((section, i) => {
      section.order = i;
    });

    setPageData((prev) => ({ ...prev, sections: newSections }));
    setSelectedSectionIndex(index - 1);
  };

  // Move section down
  const moveSectionDown = (index) => {
    if (index === pageData.sections.length - 1) return;

    const newSections = [...pageData.sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];

    // Update order values
    newSections.forEach((section, i) => {
      section.order = i;
    });

    setPageData((prev) => ({ ...prev, sections: newSections }));
    setSelectedSectionIndex(index + 1);
  };

  // Delete section
  const deleteSection = async (index) => {
    const confirmed = await showConfirm({
      title: "Delete Section",
      message: "Are you sure you want to delete this section? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger"
    });

    if (!confirmed) return;

    const newSections = pageData.sections.filter((_, i) => i !== index);

    // Update order values
    newSections.forEach((section, i) => {
      section.order = i;
    });

    setPageData((prev) => ({ ...prev, sections: newSections }));
    setSelectedSectionIndex(null);
  };

  // Toggle section visibility
  const toggleSectionVisibility = (index) => {
    const newSections = [...pageData.sections];
    newSections[index].visible = !newSections[index].visible;
    setPageData((prev) => ({ ...prev, sections: newSections }));
  };

  // Update section config
  const updateSectionConfig = (index, newConfig) => {
    const newSections = [...pageData.sections];
    newSections[index].config = { ...newSections[index].config, ...newConfig };
    setPageData((prev) => ({ ...prev, sections: newSections }));
  };

  // Update page metadata
  const updatePageMeta = (field, value) => {
    setPageData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  const selectedSection = selectedSectionIndex !== null ? pageData.sections[selectedSectionIndex] : null;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <Link
            href="/admin/dashboard/pages"
            className="text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Mobile: Add Sections Button */}
          <button
            onClick={() => setIsMobilePaletteOpen(!isMobilePaletteOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            title="Add sections"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-sm sm:text-lg truncate">{pageData.title || "Untitled Page"}</h1>
            <p className="text-xs sm:text-sm text-gray-500 truncate hidden sm:block">/myclinic/{pageData.slug}</p>
          </div>

          <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
            pageData.status === "published" ? "bg-green-100 text-green-800" :
            pageData.status === "draft" ? "bg-yellow-100 text-yellow-800" :
            "bg-gray-100 text-gray-800"
          }`}>
            {pageData.status.charAt(0).toUpperCase() + pageData.status.slice(1)}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {saveStatus && <span className="text-sm text-green-600 font-medium hidden md:block">{saveStatus}</span>}

          <button
            onClick={() => savePage(false)}
            disabled={saving}
            className="px-2 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">{saving ? "Saving..." : "Save Draft"}</span>
            <span className="sm:hidden">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </span>
          </button>

          {pageData.status !== "published" && (
            <button
              onClick={() => savePage(true)}
              disabled={saving}
              className="px-2 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors font-medium text-xs sm:text-sm hidden sm:block"
            >
              Publish
            </button>
          )}

          <a
            href={`/myclinic/${pageData.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">Preview</span>
          </a>
        </div>
      </div>

      {/* Main Content - Three Columns */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Overlay */}
        {(isMobilePaletteOpen || showConfig) && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => {
              setIsMobilePaletteOpen(false);
              setShowConfig(false);
            }}
          />
        )}

        {/* Left Panel - Section Palette */}
        {showSectionPalette && (
          <div className={`
            fixed lg:static inset-y-0 left-0 z-50 lg:z-0
            w-72 sm:w-80 lg:w-64 bg-white border-r border-gray-200 overflow-y-auto
            transform transition-transform duration-300 ease-in-out
            ${isMobilePaletteOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900 mb-1">Add Sections</h2>
                <p className="text-sm text-gray-600">Click to add to page</p>
              </div>
              <button
                onClick={() => setIsMobilePaletteOpen(false)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-3 space-y-2">
              {SECTION_TYPES.map((section) => (
                <button
                  key={section.type}
                  onClick={() => {
                    addSection(section.type);
                    setIsMobilePaletteOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-blue-50 transition-colors border border-gray-200 hover:border-blue-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 flex-shrink-0 mt-0.5">{section.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900">{section.name}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{section.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Center Panel - Section List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <div className="max-w-4xl mx-auto">
            {pageData.sections.length === 0 ? (
              <div className="text-center py-12 sm:py-20">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No sections yet</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Add sections to build your page</p>
                <button
                  onClick={() => setIsMobilePaletteOpen(true)}
                  className="lg:hidden px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Add Section
                </button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {pageData.sections.map((section, index) => {
                  const sectionDef = SECTION_TYPES.find((s) => s.type === section.type);
                  const isSelected = selectedSectionIndex === index;

                  return (
                    <div
                      key={section._id || index}
                      className={`bg-white rounded-lg border-2 p-3 sm:p-4 transition-all cursor-pointer ${
                        isSelected ? "border-blue-500 shadow-lg" : "border-gray-200 hover:border-gray-300"
                      } ${!section.visible ? "opacity-50" : ""}`}
                      onClick={() => {
                        setSelectedSectionIndex(index);
                        if (window.innerWidth < 1024) {
                          setShowConfig(true);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="text-blue-600 flex-shrink-0">{sectionDef?.icon}</div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm sm:text-base text-gray-900 truncate">{sectionDef?.name}</div>
                            <div className="text-xs sm:text-sm text-gray-600">Order: {index + 1}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSectionVisibility(index);
                            }}
                            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded transition-colors"
                            title={section.visible ? "Hide" : "Show"}
                          >
                            {section.visible ? (
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            )}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSectionUp(index);
                            }}
                            disabled={index === 0}
                            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                            title="Move up"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSectionDown(index);
                            }}
                            disabled={index === pageData.sections.length - 1}
                            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                            title="Move down"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSection(index);
                            }}
                            className="p-1.5 sm:p-2 hover:bg-red-100 rounded transition-colors text-red-600"
                            title="Delete"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Configuration */}
        <div className={`
          fixed lg:static inset-y-0 right-0 z-50 lg:z-0
          w-full sm:w-96 lg:w-96 bg-white border-l border-gray-200 overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          ${showConfig ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          {selectedSection ? (
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-base sm:text-lg">
                  {SECTION_TYPES.find((s) => s.type === selectedSection.type)?.name} Settings
                </h2>
                <button
                  onClick={() => {
                    setShowConfig(false);
                    setSelectedSectionIndex(null);
                  }}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="text-xs sm:text-sm text-gray-600 mb-4">
                Configure the selected section below. Changes are saved when you click "Save Draft" or "Publish".
              </div>

              {/* Render appropriate config form based on section type */}
              {(() => {
                const ConfigComponent = {
                  hero_carousel: HeroCarouselConfig,
                  banner_image: BannerImageConfig,
                  benefits_list: BenefitsListConfig,
                  doctor_profile: DoctorProfileConfig,
                  testimonials: TestimonialsConfig,
                  faqs: FAQConfig,
                  location_map: LocationMapConfig,
                  disease_icons_scroll: DiseaseIconsScrollConfig,
                  custom_text: CustomTextConfig,
                  cta_button: CTAButtonConfig,
                  booking_form: BookingFormConfig,
                  clinic_info: ClinicInfoConfig,
                  professional_fees: ProfessionalFeesConfig,
                  footer: FooterConfig,
                  whatsapp_sticky: WhatsAppStickyButtonConfig,
                  book_now_sticky: BookNowStickyButtonConfig,
                  faq_chatbot: ChatbotConfig,
                }[selectedSection.type];

                if (!ConfigComponent) {
                  return (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                      Config form not found for this section type.
                    </div>
                  );
                }

                return (
                  <ConfigComponent
                    config={selectedSection.config}
                    onChange={(newConfig) => updateSectionConfig(selectedSectionIndex, newConfig)}
                    slug={pageData.slug}
                  />
                );
              })()}
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-base sm:text-lg">Page Settings</h2>
                <button
                  onClick={() => setShowConfig(false)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={pageData.title}
                    onChange={(e) => updatePageMeta("title", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                  <input
                    type="text"
                    value={pageData.slug}
                    onChange={(e) => updatePageMeta("slug", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={pageData.status}
                    onChange={(e) => updatePageMeta("status", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={pageData.consultationFee}
                    onChange={(e) => updatePageMeta("consultationFee", Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Booking Fee (₹)</label>
                  <input
                    type="number"
                    value={pageData.bookingFee}
                    onChange={(e) => updatePageMeta("bookingFee", Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                  <textarea
                    value={pageData.metaDescription}
                    onChange={(e) => updatePageMeta("metaDescription", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Navbar & Clinic Card Settings */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Navbar & Clinic Card Settings</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={pageData.category || "other"}
                        onChange={(e) => updatePageMeta("category", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="myclinic">My Clinic</option>
                        <option value="gbsi">GBSI</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showInNavbar"
                        checked={pageData.showInNavbar || false}
                        onChange={(e) => updatePageMeta("showInNavbar", e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <label htmlFor="showInNavbar" className="text-sm font-medium text-gray-700">
                        Show in Navbar Dropdown
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Display Name (for navbar/cards)</label>
                      <input
                        type="text"
                        value={pageData.displayName || ""}
                        onChange={(e) => updatePageMeta("displayName", e.target.value)}
                        placeholder={pageData.title}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Short Description (for clinic card)</label>
                      <textarea
                        value={pageData.shortDescription || ""}
                        onChange={(e) => updatePageMeta("shortDescription", e.target.value)}
                        rows={2}
                        maxLength={200}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                      <input
                        type="number"
                        value={pageData.displayOrder || 0}
                        onChange={(e) => updatePageMeta("displayOrder", Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Icon Type</label>
                      <select
                        value={pageData.iconType || "custom"}
                        onChange={(e) => updatePageMeta("iconType", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="gallbladder">Gallbladder</option>
                        <option value="ibs">IBS</option>
                        <option value="second-opinion">Second Opinion</option>
                        <option value="online">Online/Video</option>
                        <option value="liver">Liver</option>
                        <option value="pancreas">Pancreas</option>
                        <option value="stomach">Stomach</option>
                        <option value="custom">Custom/Default</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Color Scheme</label>
                      <select
                        value={pageData.colorScheme || "blue"}
                        onChange={(e) => updatePageMeta("colorScheme", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="green">Green</option>
                        <option value="blue">Blue</option>
                        <option value="purple">Purple</option>
                        <option value="orange">Orange</option>
                        <option value="red">Red</option>
                        <option value="teal">Teal</option>
                        <option value="indigo">Indigo</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-800">
                  <strong>Tip:</strong> Click on a section in the center panel to configure it.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Floating Settings Button - Mobile */}
        <button
          onClick={() => {
            setSelectedSectionIndex(null);
            setShowConfig(true);
          }}
          className="lg:hidden fixed bottom-6 right-6 z-30 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Page Settings"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
