"use client";

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import SectionRenderer from "@/components/booking-page/SectionRenderer";
import WhatsAppStickyButton from "@/components/booking-page/sections/WhatsAppStickyButton";
import FooterSection from "@/components/booking-page/sections/FooterSection";
import BookNowStickyButton from "@/components/booking-page/sections/BookNowStickyButton";
import FAQChatbot from "@/components/FAQChatbot";
import { trackPageView } from "@/lib/tracking";

export default function DynamicBookingPage() {
  const params = useParams();
  const { slug } = params;
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    async function fetchPage() {
      try {
        setLoading(true);

        // Check if user is admin (has token) to enable preview mode
        const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
        const previewParam = adminToken ? '?preview=true' : '';

        const response = await fetch(`/api/booking-pages/${slug}${previewParam}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('not-found');
            return;
          }
          throw new Error('Failed to load page');
        }

        const data = await response.json();

        if (data.success) {
          setPageData(data.page);
          // Only show preview mode if page is actually in draft status
          setIsPreview(adminToken && data.page.status === 'draft');
          // Track page view
          trackPageView(data.page.title, `/myclinic/${slug}`);
        } else {
          throw new Error(data.error || 'Failed to load page');
        }
      } catch (err) {
        console.error('Error loading page:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchPage();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-beige-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-700 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (error === 'not-found' || !pageData) {
    return <NotFoundContent slug={slug} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-beige-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <a
            href="/myclinic"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to Main Booking Page
          </a>
        </div>
      </div>
    );
  }

  const trackingContext = {
    pageName: pageData.title,
    pageSlug: slug,
  };

  // Separate special sections from regular sections
  const regularSections = pageData.sections.filter(
    (s) => s.type !== "whatsapp_sticky" && s.type !== "footer" && s.type !== "book_now_sticky" && s.type !== "faq_chatbot"
  );
  const whatsappSection = pageData.sections.find((s) => s.type === "whatsapp_sticky" && s.visible);
  const footerSection = pageData.sections.find((s) => s.type === "footer" && s.visible);
  const bookNowSection = pageData.sections.find((s) => s.type === "book_now_sticky" && s.visible);
  const chatbotSection = pageData.sections.find((s) => s.type === "faq_chatbot" && s.visible);

  return (
    <div className="min-h-screen">
      {/* Preview Banner for Admins */}
      {isPreview && (
        <div className="bg-yellow-500 text-white py-2 px-4 text-center font-semibold sticky top-0 z-50 shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Preview Mode - This page is not published yet</span>
          </div>
        </div>
      )}

      {/* Regular Sections */}
      {regularSections.map((section) => (
        <SectionRenderer
          key={section._id}
          section={section}
          trackingContext={trackingContext}
          consultationFee={pageData.consultationFee}
          bookingFee={pageData.bookingFee}
        />
      ))}

      {/* Footer Section - Always at the end */}
      {footerSection && (
        <FooterSection
          {...footerSection.config}
          trackingContext={trackingContext}
        />
      )}

      {/* Sticky Buttons - Rendered last for proper z-index */}
      {whatsappSection && (
        <WhatsAppStickyButton
          {...whatsappSection.config}
          trackingContext={trackingContext}
        />
      )}

      {bookNowSection && (
        <BookNowStickyButton
          {...bookNowSection.config}
          trackingContext={trackingContext}
        />
      )}

      {/* FAQ Chatbot */}
      {chatbotSection && chatbotSection.config?.enabled !== false && (
        <FAQChatbot
          {...chatbotSection.config}
          currentPage={slug}
        />
      )}
    </div>
  );
}

function NotFoundContent({ slug }) {
  return (
    <div className="min-h-screen bg-beige-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-gray-700 mb-2">
          The booking page <span className="font-mono text-primary-600">/{slug}</span> does not exist.
        </p>
        <p className="text-gray-600 mb-8">
          It may have been moved or is no longer available.
        </p>
        <a
          href="/myclinic"
          className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
        >
          Go to Main Booking Page
        </a>
      </div>
    </div>
  );
}
