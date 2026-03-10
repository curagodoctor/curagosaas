'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    callbackTime: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setFormSubmitting(false);
    setFormSuccess(true);
    setFormData({ name: '', phone: '', email: '', callbackTime: '' });
  };

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
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-[#096b17] font-medium transition-all duration-300"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-[#096b17] hover:bg-[#075110] text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105"
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
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="py-2 text-gray-800"
                  >
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
              CuraGo: The Specialized Patient Discovery & Practice Growth Ecosystem
            </h1>
            <p className="text-xl md:text-2xl text-[#64CB81] font-medium mb-8">
              Where Ethical Clinical Expertise Meets High-Performance Patient Acquisition.
            </p>
            <a
              href="#join-us"
              className="inline-flex items-center gap-2 bg-[#64CB81] hover:bg-[#5ab56e] text-[#053d0b] px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              Apply to Join the Umbrella
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* What is CuraGo Section */}
      <section className="py-16 md:py-24" style={{ backgroundColor: '#FFFDBD' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
              What is CuraGo?
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              An elite ecosystem designed exclusively for verified medical consultants
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-[#096b17] rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">The Umbrella Ecosystem</h3>
              <p className="text-white/90 leading-relaxed">
                CuraGo is not just software — it's an integrated growth engine that combines technology, marketing, and patient coordination under one roof.
              </p>
            </div>

            <div className="bg-[#096b17] rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Handpicked Excellence</h3>
              <p className="text-white/90 leading-relaxed">
                We handpick dedicated consultants who prioritize ethical, scientific medical practice and empower them with the same systems that have scaled our own clinical landmarks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Established Services */}
      <section className="py-16 md:py-24 bg-[#096b17]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Our Established Services
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Explore our specialized healthcare platforms designed to provide you with the best care
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFDBD' }}>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Dr Yuvaraj's Gastro Digital Clinic</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Expert gastroenterology consultations with Dr. Yuvaraj T, MS, MCh (Gold Medalist). Get personalized digestive health care from a leading specialist.
              </p>
              <a
                href="https://dryuvaraj.curago.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-[#096b17] font-medium hover:underline"
              >
                Book Consultation
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFDBD' }}>
              <div className="mb-2">
                <span className="text-xs font-semibold text-[#096b17] uppercase tracking-wide">Science Meets Mind</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Mental Health Platform</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                India's trusted online mental health platform. Connect with verified psychiatrists and psychologists for confidential consultations.
              </p>
              <a
                href="https://mindfully.curago.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-[#096b17] font-medium hover:underline"
              >
                Explore Mental Health Services
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFDBD' }}>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Anxiety Care</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Specialized anxiety assessment and management tools. Understand your anxiety triggers and get personalized care recommendations.
              </p>
              <a
                href="https://anxietycare.curago.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-[#096b17] font-medium hover:underline"
              >
                Start Assessment
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Stage Practice Growth Engine */}
      <section className="py-16 md:py-24" style={{ backgroundColor: '#FFFDBD' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
              The 4-Stage Practice Growth Engine
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We solve the "Patient-Doctor Gap" through a single, integrated system that manages the entire patient lifecycle.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-[#096b17] text-white rounded-xl flex items-center justify-center text-xl font-bold mb-4">
                1
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Discovery & Acquisition</h3>
              <p className="text-xs text-[#096b17] font-semibold mb-2">The Engine</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Hyper-targeted Paid Marketing (Meta, Google, GTM) to find your "Action-Taking Cluster" of patients.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-[#096b17] text-white rounded-xl flex items-center justify-center text-xl font-bold mb-4">
                2
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Technology Support</h3>
              <p className="text-xs text-[#096b17] font-semibold mb-2">The Infrastructure</p>
              <ul className="text-gray-600 text-sm leading-relaxed space-y-1">
                <li>• High-converting websites</li>
                <li>• Automated booking systems</li>
                <li>• WhatsApp & Email automation</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-[#096b17] text-white rounded-xl flex items-center justify-center text-xl font-bold mb-4">
                3
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Patient Coordination</h3>
              <p className="text-xs text-[#096b17] font-semibold mb-2">The Human Touch</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Dedicated support desk for patient coordination and pre-consultation calls so you focus on clinical work.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-[#096b17] text-white rounded-xl flex items-center justify-center text-xl font-bold mb-4">
                4
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Long-Term Value</h3>
              <p className="text-xs text-[#096b17] font-semibold mb-2">The Retention</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Automated follow-ups and engagement increasing Lifetime Value (LTV) of every patient.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Honest Truth Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
              Does this solve the "Immediate Footfall" problem?
            </h2>
            <p className="text-lg text-gray-600">
              Let's be transparent about what to expect.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-gray-900">The Honest Truth</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Medical growth is not a "one-size-fits-all" switch. Immediate footfall depends on your geography, niche, existing reputation, and local organic brand presence.
            </p>
            <p className="text-gray-600 leading-relaxed">
              However, with time and data-backed strategies, our system ensures every consultant reaches their target goal.
            </p>
          </div>
        </div>
      </section>

      {/* Exclusivity Section */}
      <section className="py-16 md:py-24 bg-[#096b17]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              The CuraGo Umbrella: Exclusivity by Design
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              We are not an open directory. CuraGo is a curated label of excellence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFDBD' }}>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Verified Only</h3>
              <p className="text-gray-600 leading-relaxed">
                We only onboard consultants committed to ethical and value-driven medicine.
              </p>
            </div>

            <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFDBD' }}>
              <h3 className="text-xl font-bold mb-3 text-gray-900">The Interview Stage</h3>
              <p className="text-gray-600 leading-relaxed">
                Every consultant undergoes a vetting process. We only partner with those who align with the CuraGo philosophy of scientific excellence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-16 md:py-24" style={{ backgroundColor: '#FFFDBD' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
              Advantages of Joining the Ecosystem
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-3 text-gray-900">Shared Algorithmic Learning</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Benefit from the data and "Creative Moats" we have already built across different geographies.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-3 text-gray-900">Founding Team Support</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Constant strategic support from the core CuraGo team.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-3 text-gray-900">Subsidized Scale</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Access premium tools and marketing at a fraction of the cost through our collective subscription model.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-3 text-gray-900">In-House Execution</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We do the heavy lifting — from ad management to tech troubleshooting — internally.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-16 md:py-24" style={{ backgroundColor: '#FFFDBD' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
              {/* Left - Image */}
              <div className="order-2 lg:order-1">
                <div className="relative">
                  <div className="rounded-2xl overflow-hidden shadow-2xl">
                    <img
                      src="/profile.svg"
                      alt="Dr. Yuvaraj T - Founder of CuraGo"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-[#096b17] rounded-xl p-5 shadow-lg">
                      <h3 className="text-xl font-bold text-white">Dr. Yuvaraj T</h3>
                      <p className="text-[#64CB81] font-medium">MS, MCh (Gold Medalist)</p>
                      <p className="text-white text-sm">Founder of CuraGo</p>
                    </div>
                    <div className="bg-[#096b17] rounded-xl p-5 shadow-lg flex items-center justify-center">
                      <p className="text-white text-base font-semibold text-center">
                        "CuraGo is the system I wish I had when I started."
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right - Content */}
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-6">
                  The Founder's Journey: Why CuraGo?
                </h2>

                <div className="flex items-start gap-3 mb-6">
                  <svg className="w-8 h-8 text-[#096b17] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-lg text-gray-700 leading-relaxed italic">
                    CuraGo's evolution is a masterclass in founder-led iteration. We didn't start in a boardroom; we started in the trenches.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-[#096b17] rounded-xl p-5">
                    <h4 className="text-white font-bold mb-2">The Pivot to Precision</h4>
                    <p className="text-white/90 text-sm leading-relaxed">
                      Our journey began in broad Home Healthcare, moved to Online Telehealth, and specialized in Mental Health for Tier 2/3 India.
                    </p>
                  </div>

                  <div className="bg-[#096b17] rounded-xl p-5">
                    <h4 className="text-white font-bold mb-2">The Realization</h4>
                    <p className="text-white/90 text-sm leading-relaxed">
                      Through this process, I realized that the greatest challenge for brilliant Indian doctors isn't clinical skill—it's Discovery.
                    </p>
                  </div>

                  <div className="bg-[#096b17] rounded-xl p-5">
                    <h4 className="text-white font-bold mb-2">The Mission</h4>
                    <p className="text-white/90 text-sm leading-relaxed">
                      I learned Meta ads, GTM, and sales from scratch to solve this for my own practice. Now, I am opening that "Surgical-Grade" marketing system to other doctors who want to practice ethically while growing predictably.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-24" style={{ backgroundColor: '#FFFDBD' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
            Pricing Options
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            We are working on a three-tier subscription-based pricing system and it will be updated soon. Reach out to us to know more about it.
          </p>
          <p className="text-[#096b17] font-medium">
            We are consciously keeping the subscription pricing cheaper than a Saturday outing :)
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-[#096b17]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6">
              Are you a dedicated consultant ready to scale?
            </h2>
            <a
              href="#join-us"
              className="inline-flex items-center gap-2 bg-[#64CB81] hover:bg-[#5ab56e] text-[#053d0b] px-10 py-5 text-xl font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              Apply to Join the Umbrella
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <p className="mt-4 text-white/70 text-sm">
              (Note: Selection is subject to the Interview Phase)
            </p>
          </div>
        </div>
      </section>

      {/* Request a Callback Form */}
      <section id="join-us" className="py-16 md:py-24" style={{ backgroundColor: '#FFFDBD' }}>
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
              Request a Callback
            </h2>
            <p className="text-gray-600">
              Have questions? Leave your details and our team will get back to you shortly.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {formSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
                <p className="text-gray-600">We'll get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter your full name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="Enter your phone number"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="Enter your email address"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="callbackTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Callback Time *
                  </label>
                  <select
                    id="callbackTime"
                    name="callbackTime"
                    value={formData.callbackTime}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#096b17] focus:border-[#096b17] outline-none transition-all"
                  >
                    <option value="">Select a time slot</option>
                    <option value="9am-12pm">9:00 AM - 12:00 PM</option>
                    <option value="12pm-3pm">12:00 PM - 3:00 PM</option>
                    <option value="3pm-6pm">3:00 PM - 6:00 PM</option>
                    <option value="6pm-9pm">6:00 PM - 9:00 PM</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full bg-[#096b17] hover:bg-[#075110] disabled:bg-[#096b17]/60 text-white py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-[1.02] disabled:hover:scale-100"
                >
                  {formSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">&#9696;</span>
                      Submitting...
                    </span>
                  ) : (
                    'Request a Callback'
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  By submitting, you agree to receive a call from our team regarding your inquiry.
                </p>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            We respond within ~10 minutes (9:00 AM–9:00 PM). Your details are private.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <img src="/Logo.svg" alt="CuraGo Logo" className="h-10 w-auto mb-4 brightness-0 invert" />
              <p className="text-gray-400 text-sm">
                CuraGo: The Specialized Patient Discovery & Practice Growth Ecosystem. Connecting healthcare excellence with patients across India.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="https://dryuvaraj.curago.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Dr Yuvaraj's Gastro Digital Clinic
                  </a>
                </li>
                <li>
                  <a href="https://anxietycare.curago.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Anxiety Care
                  </a>
                </li>
                <li>
                  <a href="https://mindfully.curago.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Mental Health Services
                  </a>
                </li>
                <li>
                  <a href="#join-us" className="hover:text-white transition-colors">
                    Join Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Our Established Services</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Gastroenterology Consultations</li>
                <li>Mental Health Platform</li>
                <li>Anxiety Assessment & Care</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Contact Us</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="tel:+917021227203" className="hover:text-white transition-colors">
                    +91 7021227203
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/917021227203" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    WhatsApp: +91 7021227203
                  </a>
                </li>
                <li>
                  <a href="mailto:help@curago.in" className="hover:text-white transition-colors">
                    help@curago.in
                  </a>
                </li>
                <li>09:00 AM - 09:00 PM</li>
                <li>Pan India Service</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Curago Health Networking Pvt. Ltd.
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
