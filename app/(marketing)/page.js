'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled ? 'shadow-lg' : 'shadow-sm'
        }`}
        style={{ backgroundColor: '#FFFDBD' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3.5">
            {/* Logo */}
            <Link href="/" className="flex items-center cursor-pointer">
              <img src="/Logo.svg" alt="CuraGo Logo" className="h-7 sm:h-10 w-auto" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-700 hover:text-[#096b17] font-medium transition-all duration-300">
                Features
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-[#096b17] font-medium transition-all duration-300">
                Pricing
              </a>
              <a href="#contact" className="text-gray-700 hover:text-[#096b17] font-medium transition-all duration-300">
                Contact
              </a>
              <Link
                href="/login"
                className="text-gray-700 hover:text-[#096b17] font-medium transition-all duration-300"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-[#096b17] hover:bg-[#075110] text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-300 hover:scale-105"
              >
                Get Started Free
              </Link>
            </nav>

            {/* Mobile Toggle */}
            <button
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border border-black/10 hover:bg-black/5"
              aria-label="Toggle menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileOpen && (
            <div className="md:hidden overflow-hidden">
              <div className="px-4 pb-4 pt-2 border-t border-black/10" style={{ backgroundColor: '#FFFDBD' }}>
                <div className="flex flex-col space-y-3">
                  <a href="#features" onClick={() => setMobileOpen(false)} className="py-2 text-gray-800">
                    Features
                  </a>
                  <a href="#pricing" onClick={() => setMobileOpen(false)} className="py-2 text-gray-800">
                    Pricing
                  </a>
                  <a href="#contact" onClick={() => setMobileOpen(false)} className="py-2 text-gray-800">
                    Contact
                  </a>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="py-2 text-gray-800">
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="py-2 text-center bg-[#096b17] hover:bg-[#075110] text-white px-4 rounded-lg font-medium"
                  >
                    Get Started Free
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 md:pt-44 md:pb-24 bg-[#096b17] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              The Simplest Way to Establish and Grow Your Medical Practice Online
            </h1>
            <p className="text-lg md:text-xl text-[#64CB81] font-medium mb-8 max-w-3xl mx-auto">
              Build your professional website, manage bookings, connect with patients, and scale your practice — all from one integrated platform designed specifically for doctors.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#64CB81] hover:bg-[#5ab56e] text-[#053d0b] px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              Get Started Free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <p className="mt-4 text-white/80 text-sm">
              Create your digital clinic in minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Why CuraGo Exists Section */}
      <section className="py-16 md:py-24" style={{ backgroundColor: '#FFFDBD' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
                Why CuraGo Exists
              </h2>
              <p className="text-xl text-gray-700 font-medium">
                The biggest challenge for brilliant doctors today is not clinical skill.
              </p>
              <p className="text-xl text-[#096b17] font-bold mt-2">
                It is patient discovery and digital presence.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Most clinicians struggle with:</h3>
              <ul className="space-y-3">
                {[
                  'Building a professional website',
                  'Managing patient communication',
                  'Appearing on Google searches',
                  'Coordinating bookings',
                  'Running digital marketing',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#096b17] rounded-2xl p-8 text-center">
              <p className="text-xl text-white font-medium mb-2">
                CuraGo solves this problem by providing a complete digital infrastructure for clinicians.
              </p>
              <p className="text-2xl text-[#64CB81] font-bold">
                You focus on medicine. We handle the systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section id="features" className="py-16 md:py-24 bg-[#096b17]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              What You Get With CuraGo
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              CuraGo provides the core technology infrastructure every modern clinic needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Digital Clinic Setup */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFDBD' }}>
              <div className="w-14 h-14 bg-[#096b17] rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Digital Clinic Setup</h3>
              <p className="text-gray-600 text-sm mb-4">Launch your professional website in minutes.</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#096b17]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Custom doctor website
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#096b17]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Clinic profile and services
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#096b17]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Blog and educational content
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#096b17]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Custom subdomain
                </li>
              </ul>
            </div>

            {/* Patient Booking System */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFDBD' }}>
              <div className="w-14 h-14 bg-[#096b17] rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Patient Booking System</h3>
              <p className="text-gray-600 text-sm mb-4">Simplify patient access to your practice.</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#096b17]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Appointment booking system
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#096b17]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Slot management
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#096b17]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Clinic integration
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#096b17]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Meet links for online consultations
                </li>
              </ul>
            </div>

            {/* Patient Communication */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFDBD' }}>
              <div className="w-14 h-14 bg-[#096b17] rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Patient Communication</h3>
              <p className="text-gray-600 text-sm mb-4">Stay connected with patients easily.</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#096b17]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  WhatsApp contact integration
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#096b17]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Automated reminders
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#096b17]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Patient engagement tools
                </li>
              </ul>
            </div>

            {/* Practice Tools */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFDBD' }}>
              <div className="w-14 h-14 bg-[#096b17] rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Practice Tools</h3>
              <p className="text-gray-600 text-sm mb-4">Operate your clinic efficiently.</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#096b17]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Prescription generator
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#096b17]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Invoice generation
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#096b17]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Clinic management tools
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#096b17]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Analytics dashboard
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* The CuraGo Growth Engine */}
      <section className="py-16 md:py-24" style={{ backgroundColor: '#FFFDBD' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
              The CuraGo Growth Engine
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              CuraGo is more than software. It is a practice growth system designed to bridge the gap between doctors and patients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stage 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-[#096b17]">
              <div className="w-12 h-12 bg-[#096b17] text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                1
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Discovery</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Targeted marketing strategies help patients discover your expertise.
              </p>
            </div>

            {/* Stage 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-[#096b17]">
              <div className="w-12 h-12 bg-[#096b17] text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                2
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Infrastructure</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                High-converting websites and booking systems ensure seamless patient access.
              </p>
            </div>

            {/* Stage 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-[#096b17]">
              <div className="w-12 h-12 bg-[#096b17] text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                3
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Coordination</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Patient communication and reminders improve appointment conversion.
              </p>
            </div>

            {/* Stage 4 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-[#096b17]">
              <div className="w-12 h-12 bg-[#096b17] text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                4
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Retention</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Follow-ups and engagement tools increase long-term patient relationships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Expectations */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
              Transparent Expectations
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Practice growth is not a switch that turns on overnight.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Patient inflow depends on:
            </p>
            <ul className="grid sm:grid-cols-2 gap-3 mb-6">
              {['Geography', 'Specialty', 'Existing reputation', 'Local competition'].map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-[#096b17]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <div className="bg-[#096b17]/10 rounded-xl p-4 border border-[#096b17]/20">
              <p className="text-gray-700 font-medium">
                However, with consistent digital presence and data-backed strategies, CuraGo helps clinicians build sustainable long-term visibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who Can Join CuraGo */}
      <section className="py-16 md:py-24 bg-[#096b17]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Who Can Join CuraGo
            </h2>
            <p className="text-xl text-white/90 mb-8">
              CuraGo is designed exclusively for verified medical consultants.
            </p>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-8">
              <p className="text-white mb-6">We prioritize clinicians who:</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  'Practice ethical, evidence-based medicine',
                  'Want to build a strong digital presence',
                  'Value long-term professional credibility',
                ].map((item, idx) => (
                  <div key={idx} className="rounded-xl p-4" style={{ backgroundColor: '#FFFDBD' }}>
                    <p className="text-gray-800 font-medium text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24" style={{ backgroundColor: '#FFFDBD' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
              Pricing
            </h2>
            <p className="text-lg text-gray-600">
              CuraGo operates on a simple subscription model.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-[#096b17]">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <p className="text-4xl font-bold text-[#096b17]">₹0</p>
                <p className="text-gray-500 text-sm">Forever free</p>
              </div>
              <p className="text-gray-600 mb-6 text-center">Free version includes:</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Website builder',
                  'Booking system',
                  'Clinic profile',
                  'Patient communication tools',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-[#096b17]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center bg-[#096b17] hover:bg-[#075110] text-white py-3 rounded-lg font-semibold transition-all"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="bg-[#64CB81] text-[#053d0b] text-xs font-bold px-3 py-1 rounded-full">
                  Coming Soon
                </span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <p className="text-4xl font-bold text-gray-400">TBA</p>
                <p className="text-gray-500 text-sm">Pricing updated soon</p>
              </div>
              <p className="text-gray-600 mb-6 text-center">Pro features unlock:</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Advanced automation',
                  'Analytics dashboard',
                  'Priority support',
                  'Custom domain support',
                  'Marketing tools',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-500">{item}</span>
                  </li>
                ))}
              </ul>
              <button
                disabled
                className="block w-full text-center bg-gray-200 text-gray-500 py-3 rounded-lg font-semibold cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </div>

          <p className="text-center text-gray-500 mt-8 text-sm">
            Detailed pricing will be updated soon.
          </p>
        </div>
      </section>

      {/* Join CuraGo CTA */}
      <section className="py-16 md:py-24 bg-[#096b17]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Join CuraGo
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Start building your digital practice today.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#64CB81] hover:bg-[#5ab56e] text-[#053d0b] px-10 py-5 text-xl font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              Get Started Free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <p className="mt-4 text-white/70 text-sm">
              Create your digital clinic in minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <img src="/Logo.svg" alt="CuraGo Logo" className="h-10 w-auto mb-4 brightness-0 invert" />
              <p className="text-gray-400 text-sm mb-4 max-w-md">
                The Simplest Way to Establish and Grow Your Medical Practice Online. Build your professional website, manage bookings, and connect with patients.
              </p>
              <div className="inline-flex items-center gap-2 bg-[#096b17] text-white text-sm font-medium px-4 py-2 rounded-full">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Pan India Service
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">Features</a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">Login</Link>
                </li>
                <li>
                  <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#64CB81]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href="tel:+918369743571" className="hover:text-white transition-colors">
                    +91 8369743571
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <a href="https://wa.me/917021227203" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    +91 7021227203
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#64CB81]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:team@curago.in" className="hover:text-white transition-colors">
                    team@curago.in
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#64CB81]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Support: 9:00 AM – 9:00 PM</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Curago Health Networking Pvt. Ltd. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
