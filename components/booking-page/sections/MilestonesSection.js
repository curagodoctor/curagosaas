"use client";

export default function MilestonesSection({ sectionId, title = "Our Journey", subtitle, items = [] }) {
  const list = (items || []).filter((m) => m && (m.title || m.year || m.description));
  if (!list.length) return null;

  return (
    <section id={sectionId} className="container mx-auto px-4 md:px-6 py-12 md:py-16 lg:py-20 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-600 mb-3">{title}</h2>
          {subtitle && <p className="text-base md:text-lg text-primary-700 max-w-2xl mx-auto">{subtitle}</p>}
        </div>
        <div className="relative border-l-2 border-primary-200 ml-3 space-y-8">
          {list.map((m, i) => (
            <div key={i} className="relative pl-6">
              <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary-600 border-2 border-white" />
              {m.year && <div className="text-sm font-bold text-primary-600">{m.year}</div>}
              {m.title && <h3 className="text-lg font-bold text-primary-900 mt-0.5">{m.title}</h3>}
              {m.description && <p className="text-sm text-primary-800 mt-1 leading-relaxed">{m.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
