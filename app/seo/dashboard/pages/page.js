'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SEOPagesPage() {
  const [website, setWebsite] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get SEO user's doctor info
        const meRes = await fetch('/api/seo/auth/me', { credentials: 'include' });
        const meData = await meRes.json();
        if (meData.user?.doctorId) {
          setDoctorId(meData.user.doctorId);
        }

        // Fetch website pages using the doctor's token-forwarded API
        const pagesRes = await fetch('/api/admin/booking-pages?limit=1', { credentials: 'include' });
        if (pagesRes.ok) {
          const pagesData = await pagesRes.json();
          if (pagesData.pages?.length > 0) {
            setWebsite(pagesData.pages[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#096b17]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Website Builder</h1>
        <p className="text-gray-500 text-sm mt-1">Edit website content and SEO settings</p>
      </div>

      {website ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{website.title || 'Home Page'}</h2>
              <p className="text-sm text-gray-500">{website.sections?.length || 0} sections &middot; {website.status}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${website.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {website.status}
            </span>
          </div>

          {/* SEO Fields */}
          <div className="border-t pt-4 mt-4 space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Page Title</p>
              <p className="text-sm text-gray-900">{website.title || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Meta Description</p>
              <p className="text-sm text-gray-900">{website.metaDescription || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Keywords</p>
              <p className="text-sm text-gray-900">{website.metaKeywords?.join(', ') || '—'}</p>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={`/seo/dashboard/pages/${website._id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#096b17] text-white rounded-lg text-sm font-medium hover:bg-[#075110] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Page Content
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No website found for this doctor.</p>
        </div>
      )}
    </div>
  );
}
