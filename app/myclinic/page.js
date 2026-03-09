"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/booking-page/sections/FooterSection";
import { trackPageView, trackButtonClick } from "@/lib/tracking";

// Icon mapping for different clinic types
const iconMap = {
  gallbladder: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  ibs: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  'second-opinion': (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  online: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  liver: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  pancreas: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  stomach: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
    </svg>
  ),
  custom: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
};

// Color scheme mapping
const colorSchemeMap = {
  green: { color: "from-green-400 to-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" },
  blue: { color: "from-blue-400 to-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  purple: { color: "from-purple-400 to-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
  orange: { color: "from-orange-400 to-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
  red: { color: "from-red-400 to-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" },
  teal: { color: "from-teal-400 to-teal-600", bgColor: "bg-teal-50", borderColor: "border-teal-200" },
  indigo: { color: "from-indigo-400 to-indigo-600", bgColor: "bg-indigo-50", borderColor: "border-indigo-200" },
};

export default function MyClinicPage() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackPageView("My Clinic", "/myclinic");

    // Fetch clinics from API
    const fetchClinics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/clinics?category=myclinic');
        const data = await response.json();
        if (data.success && data.clinics.length > 0) {
          setClinics(data.clinics.map(clinic => ({
            name: clinic.name,
            href: clinic.href,
            description: clinic.description,
            iconType: clinic.iconType || 'custom',
            colorScheme: clinic.colorScheme || 'blue',
          })));
        }
      } catch (error) {
        console.error('Failed to fetch clinics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClinics();
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-beige-50 to-white pt-24">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-900 mb-4">
              My Clinics
            </h1>
            <p className="text-lg md:text-xl text-primary-700 mb-8">
              Specialized care for your digestive health needs. Choose the clinic that best suits your condition.
            </p>

            {/* Doctor Info */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-300">
                <Image
                  src="/profile.svg"
                  alt="Dr. Yuvaraj T"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <h2 className="font-bold text-primary-900">Dr. Yuvaraj T</h2>
                <p className="text-sm text-primary-600">MS, MCh, FMAS, FACRSI</p>
                <p className="text-sm text-primary-600">Surgical Gastroenterology</p>
              </div>
            </div>
          </div>
        </section>

        {/* Clinics Grid */}
        <section className="container mx-auto px-4 pb-16">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-gray-100 border-2 border-gray-200 rounded-2xl p-6 md:p-8 h-40"></div>
              ))}
            </div>
          ) : clinics.length === 0 ? (
            <div className="text-center py-12 text-primary-600">
              <p>No clinics available at the moment.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {clinics.map((clinic) => {
              const colors = colorSchemeMap[clinic.colorScheme] || colorSchemeMap.blue;
              const icon = iconMap[clinic.iconType] || iconMap.custom;

              return (
                <Link
                  key={clinic.href}
                  href={clinic.href}
                  onClick={() => trackButtonClick(clinic.name, "myclinic_card")}
                  className={`group relative ${colors.bgColor} ${colors.borderColor} border-2 rounded-2xl p-6 md:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${colors.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      {icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-primary-900 mb-2 group-hover:text-primary-600 transition-colors">
                        {clinic.name}
                      </h3>
                      <p className="text-primary-700 text-sm leading-relaxed">
                        {clinic.description}
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
          )}
        </section>

        {/* Quick Contact Section */}
        <section className="container mx-auto px-4 py-12 md:py-16 bg-primary-600">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Need Help Choosing?
            </h2>
            <p className="text-lg text-beige-200 mb-8">
              Not sure which clinic is right for you? Chat with us on WhatsApp for guidance.
            </p>
            <a
              href="https://wa.me/917021227203?text=Hi%2C%20I%20need%20help%20choosing%20the%20right%20clinic%20for%20my%20condition"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackButtonClick("WhatsApp Help", "myclinic_help")}
              className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Chat on WhatsApp
            </a>
          </div>
        </section>

        {/* Footer */}
        <FooterSection
          companyName="Dr Yuvaraj T"
          tagline="Your Health, Our Priority"
          address="SRV Hospital, Tilak Nagar, Chembur, Mumbai"
          phone="+91 7021227203"
          email="team@curago.in"
          showSocialLinks={false}
          showQuickLinks={true}
          quickLinks={[
            { text: "GBSI", url: "/gbsi" },
            { text: "My Clinic", url: "/myclinic" },
            { text: "Forum", url: "/#community" },
            { text: "Priority Connect", url: "/priority-connect" },
            { text: "About", url: "/about" },
          ]}
          copyrightText={`© ${new Date().getFullYear()} Dr Yuvaraj T. All rights reserved.`}
          backgroundColor="primary"
          trackingContext={{ pageName: "My Clinic", pageSlug: "myclinic" }}
        />
      </div>
    </>
  );
}
