"use client";

import { trackButtonClick } from "@/lib/tracking";

export default function ClinicInfoSection({
  title = "Find Us in Mumbai",
  address = "SRV Hospital, Tilak Nagar, Chembur.",
  locationLink = "https://maps.google.com/?q=SRV+Hospital+Tilak+Nagar+Chembur",
  showConsultationInfo = true,
  consultationFee = 1000,
  bookingFee = 150,
  trackingContext = { pageSlug: "page" },
}) {
  return (
    <section className="bg-white pt-4">
      <div className="container mx-auto px-3 md:px-4">
        <div className="text-center">
          <h2 className="text-base md:text-lg font-bold text-primary-600 mb-2">
            {title}
          </h2>
          <p className="text-sm md:text-base text-primary-800 mb-1">
            📍 {address}
          </p>
          <a
            href={locationLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackButtonClick('View Location', `${trackingContext.pageSlug}_clinic_info_section`)}
            className="inline-block text-sm md:text-base text-primary-600 hover:text-primary-700 font-semibold underline"
          >
            View Location
          </a>

          {/* Consultation Information */}
          {showConsultationInfo && (
            <div className="mt-2 pt-2 border-primary-100 max-w-2xl mx-auto">
              <p className="text-xs md:text-sm text-primary-800 mb-1">
                <span className="font-semibold">Online Consultations:</span> Available, check available slots below
              </p>
              <p className="text-xs md:text-sm text-primary-800 mb-1">
                <span className="font-semibold">Consultation fee:</span> Rs {consultationFee}/- Both Online and In-clinic
              </p>
              <p className="text-xs md:text-sm text-primary-700">
                <span className="font-semibold">Slot Booking Fee:</span> Rs {bookingFee}/- Adjusted against consultation fee
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
