"use client";

export default function AwardsSection({ sectionId, title = "Awards & Recognition", subtitle, items = [] }) {
  const list = (items || []).filter((a) => a && (a.title || a.photoUrl || a.description));
  if (!list.length) return null;

  return (
    <section id={sectionId} className="container mx-auto px-4 md:px-6 py-12 md:py-16 lg:py-20 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-600 mb-3">{title}</h2>
          {subtitle && <p className="text-base md:text-lg text-primary-700 max-w-2xl mx-auto">{subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((a, i) => (
            <div key={i} className="bg-beige-50 rounded-xl p-5 flex flex-col">
              {a.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.photoUrl} alt={a.alt || a.title || "Award"} className="w-full h-44 object-cover rounded-lg mb-4" loading="lazy" />
              )}
              {a.title && <h3 className="text-lg font-bold text-primary-900 mb-1.5">{a.title}</h3>}
              {a.description && <p className="text-sm text-primary-800 leading-relaxed">{a.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
