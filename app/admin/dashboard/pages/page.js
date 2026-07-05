"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function WebsiteBuilderPage() {
  const router = useRouter();
  const [pages, setPages] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch doctor info
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        setDoctor(meData.doctor);
      }

      // Fetch all pages
      const response = await fetch('/api/admin/booking-pages');
      if (!response.ok) {
        throw new Error("Failed to fetch pages");
      }

      const data = await response.json();
      setPages(data.pages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateFirstWebsite = async () => {
    try {
      setError(null);

      const response = await fetch('/api/admin/booking-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'home',
          title: doctor?.displayName || doctor?.name || 'My Website',
          status: 'published',
          paymentMode: 'no_payment',
          sections: [
            {
              type: 'doctor_profile',
              order: 0,
              visible: true,
              config: {
                name: doctor?.displayName || doctor?.name || '',
                title: doctor?.specialization || 'Medical Professional',
                bio: 'Welcome to my clinic. I am committed to providing quality healthcare.',
                showBookButton: true,
              },
            },
            {
              type: 'booking_form',
              order: 1,
              visible: true,
              config: {
                title: 'Book Your Consultation',
                subtitle: 'Choose your preferred consultation mode and time slot',
              },
            },
            {
              type: 'whatsapp_sticky',
              order: 2,
              visible: true,
              config: {
                phoneNumber: doctor?.whatsappNumber || doctor?.phone || '',
                message: `Hi, I would like to book a consultation.`,
                buttonText: 'Book via WhatsApp',
              },
            },
            {
              type: 'footer',
              order: 3,
              visible: true,
              config: { showPoweredBy: true },
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create website');
      }

      const data = await response.json();
      if (data.page && data.page._id) {
        router.push(`/admin/dashboard/pages/${data.page._id}`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#096b17] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your pages...</p>
        </div>
      </div>
    );
  }

  const websiteUrl = doctor?.subdomain ? `https://${doctor.subdomain}.curago.in` : '#';

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Website Builder</h1>
          <p className="text-gray-600">
            Create and manage multiple pages for your clinic website
          </p>
        </div>
        <Link
          href="/admin/dashboard/pages/new"
          className="bg-[#096b17] hover:bg-[#075110] text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Page
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Live Site URL Banner */}
      {doctor?.subdomain && (
        <div className="bg-gradient-to-r from-[#096b17] to-[#0a8f1e] rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="text-white">
            <p className="text-sm text-white/80">Your clinic website is live at</p>
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-semibold hover:underline flex items-center gap-2"
            >
              {websiteUrl.replace('https://', '')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* Pages List */}
      {pages.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-[#096b17]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#096b17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pages Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first clinic page to start receiving online bookings. You can build multiple landing pages for different services.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleCreateFirstWebsite}
              className="bg-[#096b17] hover:bg-[#075110] text-white font-semibold py-3 px-8 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Start (Home Page)
            </button>
            <Link
              href="/admin/dashboard/pages/new"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-8 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Custom Page
            </Link>
          </div>
        </div>
      ) : (
        /* Pages Grid */
        <div className="grid gap-4">
          {pages.map((page) => (
            <div
              key={page._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {page.title}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      page.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : page.status === 'archived'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {page.status === 'published' ? 'Live' : page.status === 'archived' ? 'Archived' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    /{page.slug}
                  </p>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-6 mx-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{page.views || 0}</p>
                    <p className="text-xs text-gray-500">Views</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{page.bookings || 0}</p>
                    <p className="text-xs text-gray-500">Bookings</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/admin/dashboard/pages/${page._id}`)}
                    className="bg-[#096b17] hover:bg-[#075110] text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  {page.status === 'published' && (
                    <a
                      href={`${websiteUrl}/${page.slug === 'home' ? '' : page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </a>
                  )}
                </div>
              </div>

              {/* Mobile stats */}
              <div className="flex sm:hidden items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">{page.views || 0} views</span>
                <span className="text-sm text-gray-500">{page.bookings || 0} bookings</span>
                {page.updatedAt && (
                  <span className="text-sm text-gray-400">
                    Updated {new Date(page.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tips Section */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tips for your pages
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            Create separate pages for different services (e.g., Surgery Consultation, Online Follow-up)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            Share specific page links on social media for targeted campaigns
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            Your home page is shown when patients visit your main URL
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            Add testimonials and FAQs to increase patient trust
          </li>
        </ul>
      </div>
    </div>
  );
}
