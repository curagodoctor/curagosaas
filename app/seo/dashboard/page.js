'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SEODashboardPage() {
  const [seoUser, setSeoUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/seo/auth/me', { credentials: 'include' });
        const data = await res.json();
        if (data.seoUser || data.user) {
          setSeoUser(data.seoUser || data.user);
        }
      } catch (error) {
        console.error('Error fetching SEO user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
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
      {/* Welcome Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#096b17]/10 flex items-center justify-center">
            <span className="text-2xl font-semibold text-[#096b17]">
              {seoUser?.name?.charAt(0)?.toUpperCase() || 'S'}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome, {seoUser?.name || 'SEO User'}!
            </h1>
            <p className="mt-1 text-gray-500">
              {seoUser?.doctorName
                ? `Managing website for ${seoUser.doctorName}`
                : 'Manage your assigned doctor\'s website and blog articles'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Edit Website Card */}
        <Link
          href="/seo/dashboard/pages"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-[#096b17] hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-[#096b17]/10 flex items-center justify-center group-hover:bg-[#096b17]/20 transition-colors">
              <svg className="w-6 h-6 text-[#096b17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Website</h2>
              <p className="text-sm text-gray-500">Manage website pages and sections</p>
            </div>
          </div>
          <div className="flex items-center text-[#096b17] font-medium text-sm">
            <span>Open Website Builder</span>
            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Blog Articles Card */}
        <Link
          href="/seo/dashboard/blog-articles"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-[#096b17] hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-[#096b17]/10 flex items-center justify-center group-hover:bg-[#096b17]/20 transition-colors">
              <svg className="w-6 h-6 text-[#096b17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Blog Articles</h2>
              <p className="text-sm text-gray-500">Create and manage SEO blog content</p>
            </div>
          </div>
          <div className="flex items-center text-[#096b17] font-medium text-sm">
            <span>Manage Blog Articles</span>
            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
}
