"use client";

export default function PublicationsSection({ sectionId, title = "Publications", subtitle, items = [] }) {
  const list = (items || []).filter((p) => p && p.title);
  if (!list.length) return null;

  return (
    <section id={sectionId} className="container mx-auto px-4 md:px-6 py-12 md:py-16 lg:py-20 bg-beige-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-600 mb-3">{title}</h2>
          {subtitle && <p className="text-base md:text-lg text-primary-700 max-w-2xl mx-auto">{subtitle}</p>}
        </div>
        <ul className="space-y-3">
          {list.map((p, i) => (
            <li key={i} className="bg-white rounded-lg p-4 border border-gray-100">
              {p.link ? (
                <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-primary-700 font-medium hover:underline inline-flex items-start gap-2">
                  <span>{p.title}</span>
                  <svg className="w-4 h-4 mt-1 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              ) : (
                <span className="text-primary-900 font-medium">{p.title}</span>
              )}
              {p.journal && <p className="text-xs text-primary-700 mt-1">{p.journal}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
