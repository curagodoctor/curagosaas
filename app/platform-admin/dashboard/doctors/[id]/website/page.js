'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function DoctorWebsitePreview() {
  const params = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState(null);
  const [deviceMode, setDeviceMode] = useState('desktop');

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await fetch(`/api/platform/doctors/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setDoctor(data.doctor);
          if (data.doctor.bookingPages?.length > 0) {
            setSelectedPage(data.doctor.bookingPages[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching doctor:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchDoctor();
    }
  }, [params.id]);

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'curago.in';

  const getIframeWidth = () => {
    switch (deviceMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-96 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 h-[600px] animate-pulse">
          <div className="h-full bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <p className="text-gray-500">Doctor not found</p>
        <Link href="/dashboard/doctors" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
          Back to doctors
        </Link>
      </div>
    );
  }

  const siteUrl = `https://${doctor.subdomain}.${rootDomain}`;
  const pageUrl = selectedPage
    ? `${siteUrl}/${selectedPage.slug}`
    : siteUrl;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/dashboard/doctors/${params.id}`}
              className="text-blue-600 hover:text-blue-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Website Preview
            </h1>
          </div>
          <p className="text-gray-500">
            {doctor.displayName || doctor.name} - {doctor.subdomain}.{rootDomain}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in New Tab
          </a>
        </div>
      </div>

      {/* Device Toggle & Page Selector */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Device Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 mr-2">Device:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  deviceMode === 'desktop'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setDeviceMode('tablet')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  deviceMode === 'tablet'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  deviceMode === 'mobile'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Page Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Page:</span>
            <select
              value={selectedPage?.slug || ''}
              onChange={(e) => {
                const page = doctor.bookingPages?.find(p => p.slug === e.target.value);
                setSelectedPage(page || null);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Home Page</option>
              {doctor.bookingPages?.map((page) => (
                <option key={page._id} value={page.slug}>
                  {page.title} ({page.views || 0} views)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pages List */}
      {doctor.bookingPages?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Booking Pages ({doctor.bookingPages.length})</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {doctor.bookingPages.map((page) => (
              <div
                key={page._id}
                className={`px-6 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                  selectedPage?.slug === page.slug ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedPage(page)}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{page.title}</p>
                  <p className="text-xs text-gray-500">/{page.slug}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">
                    <span className="font-medium text-gray-900">{page.views || 0}</span> views
                  </span>
                  <span className="text-gray-500">
                    <span className="font-medium text-gray-900">{page.bookingsCount || 0}</span> bookings
                  </span>
                  <a
                    href={`${siteUrl}/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Frame */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 bg-red-400 rounded-full"></span>
            <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
            <span className="w-3 h-3 bg-green-400 rounded-full"></span>
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm text-gray-600 truncate">
              {pageUrl}
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-100 flex justify-center overflow-auto" style={{ height: '600px' }}>
          <div
            className="bg-white shadow-lg transition-all duration-300"
            style={{
              width: getIframeWidth(),
              maxWidth: '100%',
              height: '100%'
            }}
          >
            <iframe
              src={pageUrl}
              className="w-full h-full border-0"
              title="Website Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
