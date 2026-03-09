"use client";

export default function BenefitsListSection({
  title = "Why Choose Us",
  subtitle,
  items = [],
}) {
  if (!items || items.length === 0) return null;

  return (
    <section className="container mx-auto px-4 md:px-6 py-12 md:py-16 lg:py-20 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-600 mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-base md:text-lg lg:text-xl text-primary-700 max-w-3xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-6 bg-beige-50 rounded-xl hover:shadow-lg transition-shadow duration-300"
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center text-white text-2xl shadow-lg">
                {item.icon || "✓"}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-bold text-primary-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-primary-800 text-sm md:text-base leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
