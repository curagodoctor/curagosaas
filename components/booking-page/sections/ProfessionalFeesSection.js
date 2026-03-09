"use client";

export default function ProfessionalFeesSection({
  title = "Professional Consultation Fees",
  subtitle = "",
  fees = [
    {
      serviceType: "In-Clinic (Offline)",
      newConsultation: "1000",
      followUp: "800",
    },
    {
      serviceType: "Video (Online)",
      newConsultation: "1000",
      followUp: "800",
    },
  ],
  showCurrency = true,
  currency = "₹",
  backgroundColor = "white", // white, beige, primary
  trackingContext = { pageSlug: "page" },
}) {
  const bgClass = {
    white: "bg-white",
    beige: "bg-beige-50",
    primary: "bg-primary-50",
  }[backgroundColor] || "bg-white";

  const formatPrice = (price) => {
    if (!price) return "-";
    const numPrice = parseInt(price, 10);
    if (isNaN(numPrice)) return price;
    return showCurrency ? `${currency}${numPrice.toLocaleString("en-IN")}` : numPrice.toLocaleString("en-IN");
  };

  return (
    <section className={`${bgClass} py-12 md:py-16 lg:py-20`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 lg:p-12 border-2 border-primary-200">
            {/* Title */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-600 mb-2 text-center">
              {title}
            </h2>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-base md:text-lg text-primary-700 mb-6 lg:mb-8 text-center">
                {subtitle}
              </p>
            )}

            {!subtitle && <div className="mb-6 lg:mb-8" />}

            {/* Fees Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary-600 text-white">
                    <th className="py-3 px-4 text-left font-semibold text-sm md:text-base border border-primary-700">
                      Service Type
                    </th>
                    <th className="py-3 px-4 text-center font-semibold text-sm md:text-base border border-primary-700">
                      New Consultation
                    </th>
                    <th className="py-3 px-4 text-center font-semibold text-sm md:text-base border border-primary-700">
                      Follow-up Visit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((fee, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-beige-50" : "bg-white"}
                    >
                      <td className="py-3 px-4 font-semibold text-primary-900 text-sm md:text-base border border-primary-200">
                        {fee.serviceType}
                      </td>
                      <td className="py-3 px-4 text-center text-primary-800 font-bold text-base md:text-lg border border-primary-200">
                        {formatPrice(fee.newConsultation)}
                      </td>
                      <td className="py-3 px-4 text-center text-primary-800 font-bold text-base md:text-lg border border-primary-200">
                        {formatPrice(fee.followUp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
