"use client";

import { useState } from "react";

export default function FAQSection({
  title = "Frequently Asked Questions",
  subtitle,
  faqs = [],
  allowMultipleOpen = false,
}) {
  const [openIndexes, setOpenIndexes] = useState([]);

  if (!faqs || faqs.length === 0) return null;

  const toggleFAQ = (index) => {
    if (allowMultipleOpen) {
      // Allow multiple FAQs to be open at once
      setOpenIndexes((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    } else {
      // Only allow one FAQ to be open at a time
      setOpenIndexes((prev) =>
        prev.includes(index) ? [] : [index]
      );
    }
  };

  const isOpen = (index) => openIndexes.includes(index);

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

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-primary-200 rounded-xl overflow-hidden bg-beige-50 hover:shadow-lg transition-shadow duration-300"
            >
              {/* Question Button */}
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 hover:bg-primary-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-inset"
                aria-expanded={isOpen(index)}
              >
                <span className="text-base md:text-lg font-semibold text-primary-900 flex-1">
                  {faq.question}
                </span>
                <svg
                  className={`w-6 h-6 text-primary-600 flex-shrink-0 transition-transform duration-300 ${
                    isOpen(index) ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Answer Panel */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isOpen(index) ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-6 pb-5 pt-2">
                  <div className="text-primary-800 text-sm md:text-base leading-relaxed prose prose-sm max-w-none">
                    {faq.answer.split('\n').map((paragraph, pIndex) => (
                      paragraph.trim() && (
                        <p key={pIndex} className="mb-3 last:mb-0">
                          {paragraph}
                        </p>
                      )
                    ))}
                  </div>

                  {/* Optional CTA Link */}
                  {faq.ctaText && faq.ctaLink && (
                    <a
                      href={faq.ctaLink}
                      className="inline-flex items-center gap-2 mt-4 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      {faq.ctaText}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Optional Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-primary-700 text-base md:text-lg mb-4">
            Still have questions?
          </p>
          <a
            href="#booking"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Book a Consultation
          </a>
        </div>
      </div>
    </section>
  );
}
