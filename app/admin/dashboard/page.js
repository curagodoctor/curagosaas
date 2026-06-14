'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [doctor, setDoctor] = useState(null);
  const [stats, setStats] = useState({
    bookingPages: 0,
    websiteViews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch doctor info
        const doctorRes = await fetch('/api/auth/me');
        if (doctorRes.ok) {
          const doctorData = await doctorRes.json();
          setDoctor(doctorData.doctor);
        }

        // Fetch website stats
        const pagesRes = await fetch('/api/admin/booking-pages?limit=1');
        const pagesData = pagesRes.ok ? await pagesRes.json() : { pagination: { total: 0 } };

        setStats({
          bookingPages: pagesData.pagination?.total || 0,
          websiteViews: pagesData.pages?.[0]?.views || 0,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate onboarding progress
  const getOnboardingSteps = () => {
    if (!doctor) return [];

    return [
      {
        id: 'profile',
        title: 'Complete Your Profile',
        description: 'Add your specialization, qualification, and bio',
        completed: !!(doctor.displayName && doctor.specialization),
        href: '/admin/dashboard/settings',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      },
      {
        id: 'whatsapp',
        title: 'Set Up WhatsApp',
        description: 'Add your WhatsApp number for patient communication',
        completed: !!doctor.whatsappNumber,
        href: '/admin/dashboard/settings',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
      },
      {
        id: 'website',
        title: 'Customize Your Website',
        description: 'Set up your clinic website sections',
        completed: stats.bookingPages > 0,
        href: '/admin/dashboard/pages',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        ),
      },
    ];
  };

  const onboardingSteps = getOnboardingSteps();
  const completedSteps = onboardingSteps.filter(s => s.completed).length;
  const progressPercent = onboardingSteps.length > 0 ? (completedSteps / onboardingSteps.length) * 100 : 0;

  const liveWebsiteUrl = doctor?.customDomain
    ? `https://${doctor.customDomain}`
    : doctor?.subdomain ? `https://${doctor.subdomain}.curago.in` : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#096b17]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back, {doctor?.displayName || doctor?.name}!
            </h1>
            <p className="mt-1 text-gray-500">
              Here&apos;s what&apos;s happening with your clinic today.
            </p>
          </div>
          {doctor?.profileImage ? (
            <img
              src={doctor.profileImage}
              alt={doctor.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#096b17]"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#096b17]/10 flex items-center justify-center">
              <span className="text-2xl font-semibold text-[#096b17]">
                {doctor?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Live Website Card */}
      <div className="bg-[#096b17] rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                <span className="w-2 h-2 rounded-full bg-green-300 mr-1.5 animate-pulse"></span>
                Live
              </span>
            </div>
            <h2 className="text-lg font-semibold mb-1">Your Live Website</h2>
            {liveWebsiteUrl ? (
              <a
                href={liveWebsiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 hover:text-white underline underline-offset-2 flex items-center gap-1"
              >
                {liveWebsiteUrl}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : (
              <p className="text-white/70">Set up your subdomain to go live</p>
            )}
          </div>
          <div className="flex gap-3">
            <a
              href={liveWebsiteUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                liveWebsiteUrl
                  ? 'bg-white text-[#096b17] hover:bg-gray-100'
                  : 'bg-white/30 text-white/70 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview Site
            </a>
            <Link
              href="/admin/dashboard/pages"
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Website
            </Link>
          </div>
        </div>
      </div>

      {/* Website Creation Pathways */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Create Your Website</h2>
        <p className="text-sm text-gray-500 mb-6">Choose how you want to build your clinic website</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* DIY - First */}
          <div className="border-2 border-[#096b17] rounded-xl p-5 relative">
            <span className="absolute -top-3 left-4 bg-[#096b17] text-white text-xs font-medium px-3 py-1 rounded-full">
              Start Here
            </span>
            <div className="w-10 h-10 rounded-lg bg-[#096b17]/10 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-[#096b17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Do It Yourself</h3>
            <p className="text-2xl font-bold text-[#096b17] mb-2">Free</p>
            <p className="text-sm text-gray-600 mb-4">
              Use our drag-and-drop Website Builder to create your clinic website yourself.
            </p>
            <Link
              href="/admin/dashboard/pages"
              className="block w-full text-center bg-[#096b17] text-white py-2.5 rounded-lg font-medium hover:bg-[#075110] transition-colors"
            >
              Open Website Builder
            </Link>
          </div>

          {/* Done For You */}
          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Done For You</h3>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              &#x20B9;2,000 <span className="text-xs font-normal text-gray-500">incl. GST</span>
            </p>
            <ul className="text-sm text-gray-600 space-y-1.5 mb-4">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                1-time full website setup
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Includes 2 free changes
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                3-5 working days turnaround
              </li>
            </ul>
            <p className="text-xs text-gray-400 mb-3">Terms and conditions apply</p>
            <a
              href="mailto:support@curago.in?subject=Done For You Website Setup"
              className="block w-full text-center bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Reach Out to Us
            </a>
          </div>

          {/* AI-Powered */}
          <div className="border border-gray-200 rounded-xl p-5 opacity-60 relative">
            <span className="absolute top-3 right-3 bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
              Coming Soon
            </span>
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">AI-Powered</h3>
            <p className="text-sm text-gray-600 mb-4">
              Use AI to auto-generate your clinic website. Fill a quick form, upload docs, and get a professional site instantly.
            </p>
            <button
              disabled
              className="block w-full text-center bg-gray-200 text-gray-500 py-2.5 rounded-lg font-medium cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Website</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.bookingPages > 0 ? 'Active' : 'Not Set'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Website Views</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.websiteViews}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Steps */}
      {progressPercent < 100 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Complete Your Setup</h2>
              <p className="text-sm text-gray-500">
                {completedSteps} of {onboardingSteps.length} steps completed
              </p>
            </div>
            <span className="text-sm font-medium text-[#096b17]">{Math.round(progressPercent)}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className="bg-[#096b17] h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {onboardingSteps.map((step) => (
              <Link
                key={step.id}
                href={step.href}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                  step.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200 hover:border-[#096b17] hover:bg-[#096b17]/5'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.completed
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.completed ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${step.completed ? 'text-green-700' : 'text-gray-900'}`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm ${step.completed ? 'text-green-600' : 'text-gray-500'}`}>
                    {step.description}
                  </p>
                </div>
                {!step.completed && (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/dashboard/contacts"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-[#096b17] hover:bg-[#096b17]/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Contacts</span>
          </Link>

          <Link
            href="/admin/dashboard/pages"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-[#096b17] hover:bg-[#096b17]/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Edit Website</span>
          </Link>

          <Link
            href="/admin/dashboard/blog-articles"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-[#096b17] hover:bg-[#096b17]/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Blog Articles</span>
          </Link>

          <Link
            href="/admin/dashboard/settings"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-[#096b17] hover:bg-[#096b17]/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
