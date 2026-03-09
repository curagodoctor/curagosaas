'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BlogArticlePage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [params.slug]);

  const fetchArticle = async () => {
    try {
      const response = await fetch(`/api/blog-articles/${params.slug}`);

      if (!response.ok) {
        router.push('/blog');
        return;
      }

      const data = await response.json();
      if (data.article) {
        setArticle(data.article);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching article:', error);
      router.push('/blog');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading article...</div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-gray-600 hover:text-green-600 text-sm font-medium mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Articles
          </Link>

          {/* Category Badge */}
          {article.category && (
            <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded mb-3">
              {article.category}
            </span>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {article.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="font-medium">{article.author?.name || 'Dr. Yuvaraj T'}</span>
            <span>•</span>
            <span>{formatDate(article.publishedAt)}</span>
            <span>•</span>
            <span>{article.analytics?.views || 0} views</span>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {article.featuredImage?.url && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
            <img
              src={article.featuredImage.url}
              alt={article.featuredImage.alt || article.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Article Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-10">

          {/* Section 1: The Problem */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-green-600">
              {article.problemSection?.heading || 'The Problem: Common Misconceptions & Symptoms'}
            </h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">
              {article.problemSection?.content}
            </div>
          </section>

          {/* Section 2: Clinical Deep Dive */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-green-600">
              {article.clinicalSection?.heading || 'Clinical Deep Dive: Why This Condition Needs Attention'}
            </h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">
              {article.clinicalSection?.content}
            </div>
          </section>

          {/* Section 3: Specialist Advantage */}
          <section className="bg-green-50 rounded-lg p-6 border-l-4 border-green-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {article.specialistSection?.heading || 'The Specialist Advantage: My Clinical Approach'}
            </h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line mb-6">
              {article.specialistSection?.content}
            </div>

            {/* Stats Highlight */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 text-center border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {article.specialistSection?.stats?.surgeriesPerformed || 250}+
                </div>
                <div className="text-sm text-gray-600 font-medium">Surgeries Performed</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {article.specialistSection?.stats?.proceduresSupervised || 300}+
                </div>
                <div className="text-sm text-gray-600 font-medium">Procedures Supervised</div>
              </div>
            </div>
          </section>

          {/* Section 4: Complex Cases */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-green-600">
              {article.complexCasesSection?.heading || 'Complex Cases: Managing High-Risk Scenarios'}
            </h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">
              {article.complexCasesSection?.content}
            </div>
          </section>

          {/* Section 5: Surgical Audit */}
          <section className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {article.surgicalAuditSection?.heading || 'The Surgical Audit: What to Expect During Your Consultation'}
            </h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line mb-6">
              {article.surgicalAuditSection?.content}
            </div>

            {/* Audit Steps */}
            {article.surgicalAuditSection?.auditSteps && article.surgicalAuditSection.auditSteps.length > 0 && (
              <div className="space-y-3 mb-6">
                {article.surgicalAuditSection.auditSteps.map((step, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{step.step}</h4>
                        {step.description && (
                          <p className="text-sm text-gray-600">{step.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Price Badge */}
            <div className="text-center">
              <div className="inline-flex items-baseline gap-2 bg-green-600 text-white px-6 py-3 rounded-lg">
                <span className="text-sm font-medium">Consultation Fee:</span>
                <span className="text-3xl font-bold">₹{article.surgicalAuditSection?.auditPrice || 150}</span>
              </div>
            </div>
          </section>

          {/* Section 6: FAQs */}
          {article.faqSection?.faqs && article.faqSection.faqs.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-green-600">
                {article.faqSection?.heading || 'FAQs: Clear Answers for Patients'}
              </h2>
              <div className="space-y-4">
                {article.faqSection.faqs.map((faq, index) => (
                  faq.question && faq.answer && (
                    <div key={index} className="border border-gray-200 rounded-lg p-5">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-start gap-2">
                        <span className="text-green-600 flex-shrink-0">Q{index + 1}.</span>
                        <span>{faq.question}</span>
                      </h3>
                      <div className="pl-6 text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                        {faq.answer}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </section>
          )}

          {/* CTA Section */}
          <section className="bg-green-600 text-white rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold mb-2">
              Ready to Take the Next Step?
            </h2>
            <p className="mb-4 opacity-90">
              Schedule your ₹150 Surgical Audit with Dr. Yuvaraj T
            </p>
            <Link
              href="/schedule-consultation"
              className="inline-block bg-white text-green-600 hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Schedule Consultation
            </Link>
          </section>
        </div>

        {/* Back Navigation */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to All Articles
          </Link>
        </div>
      </main>
    </div>
  );
}
