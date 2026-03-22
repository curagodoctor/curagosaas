"use client";

import { trackButtonClick } from "@/lib/tracking";

export default function ClinicInfoSection({
  sectionId,
  title = "Our Clinic Locations",
  // Support for multiple clinics (new format)
  clinics = [],
  // Legacy single clinic props (backward compatibility)
  address = "",
  locationLink = "",
  showConsultationInfo = true,
  consultationFee = 1000,
  bookingFee = 150,
  trackingContext = { pageSlug: "page" },
}) {
  // Build clinics array - support both new and legacy formats
  let clinicList = clinics;

  // If no clinics array but legacy props exist, create single clinic
  if ((!clinicList || clinicList.length === 0) && address) {
    clinicList = [{
      name: "Main Clinic",
      address: address,
      locationLink: locationLink,
      phone: "",
      timings: "",
    }];
  }

  // If still no clinics, don't render section
  if (!clinicList || clinicList.length === 0) {
    return null;
  }

  return (
    <section id={sectionId} className="bg-white py-8 md:py-12">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Title */}
        <h2 className="text-xl md:text-2xl font-bold text-primary-600 mb-6 text-center">
          {title}
        </h2>

        {/* Clinics Grid */}
        <div className={`grid gap-4 md:gap-6 ${
          clinicList.length === 1
            ? 'max-w-xl mx-auto'
            : clinicList.length === 2
              ? 'md:grid-cols-2 max-w-4xl mx-auto'
              : 'md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {clinicList.map((clinic, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Clinic Name */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-primary-900 text-base md:text-lg">
                    {clinic.name || `Clinic ${index + 1}`}
                  </h3>
                </div>
              </div>

              {/* Address */}
              <div className="mb-3">
                <p className="text-sm md:text-base text-primary-800 flex items-start gap-2">
                  <span className="flex-shrink-0">📍</span>
                  <span>{clinic.address}</span>
                </p>
              </div>

              {/* Phone */}
              {clinic.phone && (
                <div className="mb-2">
                  <a
                    href={`tel:${clinic.phone.replace(/\s/g, '')}`}
                    className="text-sm text-primary-700 hover:text-primary-800 flex items-center gap-2"
                  >
                    <span>📞</span>
                    <span>{clinic.phone}</span>
                  </a>
                </div>
              )}

              {/* Timings */}
              {clinic.timings && (
                <div className="mb-3">
                  <p className="text-sm text-primary-700 flex items-center gap-2">
                    <span>🕐</span>
                    <span>{clinic.timings}</span>
                  </p>
                </div>
              )}

              {/* Location Link */}
              {clinic.locationLink && (
                <a
                  href={clinic.locationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackButtonClick(`View Location - ${clinic.name}`, `${trackingContext.pageSlug}_clinic_info_section`)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 mt-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  View on Maps
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Consultation Information */}
        {showConsultationInfo && (
          <div className="mt-8 pt-6 border-t border-primary-100 max-w-2xl mx-auto text-center">
            <div className="bg-primary-50 rounded-xl p-4 md:p-6">
              <h4 className="font-semibold text-primary-800 mb-3">Consultation Information</h4>
              <div className="space-y-2 text-sm md:text-base">
                <p className="text-primary-800">
                  <span className="font-medium">Online Consultations:</span> Available, check available slots below
                </p>
                <p className="text-primary-800">
                  <span className="font-medium">Consultation Fee:</span> ₹{consultationFee}/- (Online & In-clinic)
                </p>
                <p className="text-primary-700">
                  <span className="font-medium">Slot Booking Fee:</span> ₹{bookingFee}/- (Adjusted against consultation)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
