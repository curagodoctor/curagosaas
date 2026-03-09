"use client";

import { useState } from "react";
import Section from "@/components/Section";
import Footer from "@/components/Footer";
import ApplicationModal from "@/components/ApplicationModal";
import RazorpayButton from "@/components/RazorpayButton";

export default function DigitalClinicPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="min-h-screen"> 
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
            Digital Clinic
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Experience convenient, expert care from anywhere. Your health, your schedule.
          </p>
        </div>
      </section>

      {/* Specialized Consultations */}
      <Section bgColor="bg-white">
        <div className="text-center mb-10 md:mb-16 px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
            Specialized Consultations
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Expert gastroenterology consultations designed for your convenience.
          </p>
        </div>

        {/* Video Consultations */}
        <div className="max-w-5xl mx-auto mb-12 md:mb-16">
          <div className="bg-gradient-to-br from-primary-50 to-[#E8F5E9] rounded-2xl md:rounded-3xl p-6 md:p-10 lg:p-12 border-2 border-primary-200">
            <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-primary-600 to-[#25D366] rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 md:mb-4 leading-tight">
                  Comprehensive Video Consultations
                </h3>
                <p className="text-sm md:text-base lg:text-lg text-gray-700 mb-4 md:mb-6 leading-relaxed">
                  20-minute deep-dives into your history, reports, and symptoms. Perfect for patients who cannot travel to the clinic.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {/* First Time Consultation */}
              <div className="bg-white rounded-xl md:rounded-2xl p-5 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary-100 p-2.5 md:p-3 rounded-lg md:rounded-xl">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 break-words">First Time Consultation</h4>
                    <p className="text-xs md:text-sm text-gray-600">All inclusive</p>
                  </div>
                </div>
                <div className="mb-5 md:mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl md:text-4xl font-bold text-primary-600">₹1,000</span>
                    <span className="text-sm md:text-base text-gray-500">/ consultation</span>
                  </div>
                </div>
                <ul className="space-y-2.5 md:space-y-3 mb-6 md:mb-8">
                  {[
                    "20-minute video consultation",
                    "Detailed history taking",
                    "Report review & analysis",
                    "Personalized recommendations"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-[#25D366] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm md:text-base text-gray-700 break-words">{feature}</span>
                    </li>
                  ))}
                </ul>
                <RazorpayButton paymentButtonId="pl_S16kCY67frwiRs" />
              </div>

              {/* Follow-up Consultation */}
              <div className="relative bg-white rounded-xl md:rounded-2xl p-5 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-[#25D366]">
                <div className="absolute top-3 md:top-4 right-3 md:right-4 bg-[#25D366] text-white text-xs font-bold px-2.5 md:px-3 py-1 rounded-full">
                  POPULAR
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-[#E8F5E9] p-2.5 md:p-3 rounded-lg md:rounded-xl">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-[#25D366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 break-words">Follow-up Consultation</h4>
                    <p className="text-xs md:text-sm text-gray-600">All inclusive</p>
                  </div>
                </div>
                <div className="mb-5 md:mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl md:text-4xl font-bold text-[#25D366]">₹800</span>
                    <span className="text-sm md:text-base text-gray-500">/ consultation</span>
                  </div>
                </div>
                <ul className="space-y-2.5 md:space-y-3 mb-6 md:mb-8">
                  {[
                    "20-minute follow-up session",
                    "Progress review",
                    "Treatment adjustments",
                    "Ongoing support"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-[#25D366] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm md:text-base text-gray-700 break-words">{feature}</span>
                    </li>
                  ))}
                </ul>
                <RazorpayButton paymentButtonId="pl_S16maiOqi09QAb" />
              </div>
            </div>
          </div>
        </div>

        {/* Priority In-Clinic Review */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900 rounded-2xl md:rounded-3xl p-6 md:p-10 lg:p-12 text-white">
            <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4 leading-tight">
                  Priority In-Clinic Review
                </h3>
                <p className="text-sm md:text-base lg:text-lg text-gray-300 mb-5 md:mb-6 leading-relaxed">
                  For cases that require physical examination or pre-surgical workup. Get priority access to the clinic in Mumbai.
                </p>
                <a
                  href="https://wa.me/917021227203?text=Hi%2C%20I%20want%20to%20book%20an%20in-clinic%20consult%20with%20Dr.%20Yuvaraj%2C%20please%20guide%20me"
                  className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 font-semibold px-5 md:px-8 py-3 md:py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-sm md:text-base w-full md:w-auto"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  <span className="break-words">Request Appointment on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Priority Circle 365 */}
      <Section bgColor="bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16 px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
              Priority Circle 365
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              A 365-Day Partnership for Your Gut Health
            </p>
          </div>

          {/* Benefits in Single Tile */}
          <div className="max-w-4xl mx-auto bg-beige-200 p-4 md:p-6 lg:p-8 rounded-xl md:rounded-2xl shadow-xl border border-primary-100 mb-10 md:mb-12">
            <div className="space-y-3 md:space-y-4">
              {[
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  ),
                  title: "Direct WhatsApp Oversight",
                  description: "Guidance on flare-ups and report reviews"
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  ),
                  title: "Priority Virtual Consults",
                  description: "Skip the wait for expert diagnostic sessions"
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ),
                  title: "The Private Forum",
                  description: "Anonymous community for surgical-grade answers"
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  ),
                  title: "Specialist Network",
                  description: "Priority access to physical clinic in Mumbai"
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: "Priority Access",
                  description: "Special price for all CuraGo's services"
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ),
                  title: "Easier Rescheduling",
                  description: "Flexible appointment management"
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  ),
                  title: "Family Coverage",
                  description: "Upgrade to include your loved ones"
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  title: "Overall Medical Guidance",
                  description: "Holistic health support beyond GI"
                }
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 md:gap-4">
                  <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center text-white shadow-lg">
                    {benefit.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm md:text-base font-bold text-primary-900 mb-1 break-words">
                      {benefit.title}
                    </h3>
                    <p className="text-primary-800 text-xs md:text-sm leading-relaxed break-words">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#25D366] to-[#20BA5A] rounded-3xl p-12 text-center text-white shadow-2xl">
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              Ready for Year-Round Expert Support?
            </h3>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join Priority Circle 365 and never feel alone in your gut health journey.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-3 bg-white text-gray-900 font-bold text-xl px-12 py-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:bg-gray-50"
            >
              <span>Apply Now</span>
            </button>
            <p className="mt-6 text-sm text-white/80">
              Limited memberships available • Priority onboarding
            </p>
          </div>
        </div>
      </Section>

      <ApplicationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <Footer />
    </main>
  );
}
