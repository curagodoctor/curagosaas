"use client";

import { trackButtonClick } from "@/lib/tracking";

export default function LocationMapSection({
  title = "Visit Our Clinic",
  address = "SRV Hospital, Tilak Nagar, Chembur, Mumbai",
  mapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.7127635984716!2d72.89472647501823!3d19.05964598211234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c92e8fffffff%3A0x79c1c5c7e3e3e3e3!2sSRV%20Hospital!5e0!3m2!1sen!2sin!4v1737700000000!5m2!1sen!2sin",
  showDirectionsButton = true,
  trackingContext = { pageSlug: "page" },
}) {
  return (
    <section className="container mx-auto px-4 md:px-6 py-12 md:py-16 lg:py-20 bg-beige-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 lg:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-600 mb-4 lg:mb-6">
            {title}
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-primary-700 mb-4 lg:mb-6">
            📍 {address}
          </p>
          {showDirectionsButton && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackButtonClick("View on Google Maps", `${trackingContext.pageSlug}_clinic_location_section`)}
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              View on Google Maps
            </a>
          )}
        </div>

        {/* Map Embed */}
        {mapUrl && (
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <iframe
              src={mapUrl}
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full"
            ></iframe>
          </div>
        )}

        {!mapUrl && (
          <div className="rounded-2xl overflow-hidden shadow-2xl bg-gray-100 flex items-center justify-center" style={{ height: '450px' }}>
            <div className="text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm">Map not configured</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
