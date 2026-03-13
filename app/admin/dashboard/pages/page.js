"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function WebsiteBuilderPage() {
  const router = useRouter();
  const [website, setWebsite] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState(false);
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

      // Fetch website (the single "home" page)
      const response = await fetch('/api/admin/booking-pages?limit=1');
      if (!response.ok) {
        throw new Error("Failed to fetch website");
      }

      const data = await response.json();
      if (data.pages && data.pages.length > 0) {
        setWebsite(data.pages[0]);
      } else {
        setWebsite(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditWebsite = () => {
    if (website && website._id) {
      router.push(`/admin/dashboard/pages/${website._id}`);
    }
  };

  const handlePublishWebsite = async () => {
    if (!website || !website._id) return;

    try {
      setPublishing(true);
      const response = await fetch(`/api/admin/booking-pages/${website._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'published',
          publishedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish website');
      }

      // Refresh data
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleCreateWebsite = async () => {
    try {
      setCreating(true);
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
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#096b17] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your website...</p>
        </div>
      </div>
    );
  }

  const websiteUrl = doctor?.subdomain ? `https://${doctor.subdomain}.curago.in` : '#';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Website Builder</h1>
        <p className="text-gray-600">
          Customize your clinic website with our drag-and-drop builder
        </p>
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

      {/* Website Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Website Preview Header */}
        <div className="bg-gradient-to-r from-[#096b17] to-[#0a8f1e] p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">Your Clinic Website</h2>
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 hover:text-white flex items-center gap-2 text-sm transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {websiteUrl.replace('https://', '')}
              </a>
            </div>
            {website && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                website.status === 'published'
                  ? 'bg-green-400/20 text-green-100'
                  : 'bg-yellow-400/20 text-yellow-100'
              }`}>
                {website.status === 'published' ? '● Live' : '● Draft'}
              </span>
            )}
          </div>
        </div>

        {/* Website Content */}
        <div className="p-6">
          {website ? (
            <>
              {/* Website Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">{website.views || 0}</div>
                  <div className="text-sm text-gray-500">Page Views</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">{website.bookings || 0}</div>
                  <div className="text-sm text-gray-500">Bookings</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">{website.sections?.length || 0}</div>
                  <div className="text-sm text-gray-500">Sections</div>
                </div>
              </div>

              {/* Sections Preview */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Website Sections</h3>
                <div className="flex flex-wrap gap-2">
                  {website.sections?.filter(s => s.visible).map((section, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-[#096b17]/10 text-[#096b17] text-xs font-medium rounded-full"
                    >
                      {section.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleEditWebsite}
                  className="flex-1 bg-[#096b17] hover:bg-[#075110] text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Website
                </button>

                {website.status !== 'published' && (
                  <button
                    onClick={handlePublishWebsite}
                    disabled={publishing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {publishing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Publishing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Publish Website
                      </>
                    )}
                  </button>
                )}

                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview Live Site
                </a>
              </div>

              {/* Last Updated */}
              {website.updatedAt && (
                <p className="text-xs text-gray-500 mt-4 text-center">
                  Last updated: {new Date(website.updatedAt).toLocaleString()}
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#096b17]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#096b17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Website Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your clinic website to start receiving online bookings
              </p>
              <button
                onClick={handleCreateWebsite}
                disabled={creating}
                className="bg-[#096b17] hover:bg-[#075110] disabled:bg-[#096b17]/60 text-white font-semibold py-3 px-8 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Website...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create My Website
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tips to get more bookings
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            Add a professional profile photo to build trust
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            Include your qualifications and experience
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            Set up your consultation modes and time slots
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            Share your website link on social media and WhatsApp
          </li>
        </ul>
      </div>
    </div>
  );
}
