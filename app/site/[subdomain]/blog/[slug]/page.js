import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import BlogArticle from '@/models/BlogArticle';

// The tenant's own origin (subdomain/custom domain) from the request host, so
// canonical/OG URLs resolve to the doctor's own domain, not curago.in.
async function tenantBase() {
  const h = await headers();
  const host = h.get('host') || '';
  const proto = h.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return host ? `${proto}://${host}` : null;
}

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function generateMetadata({ params }) {
  const { subdomain, slug } = await params;

  try {
    await connectDB();

    const doctor = await Doctor.findOne({
      subdomain: subdomain.toLowerCase(),
      isActive: true,
      isEmailVerified: true,
    }).lean();

    if (!doctor) {
      return { title: 'Site Not Found' };
    }

    const article = await BlogArticle.findOne({
      doctorId: doctor._id,
      slug,
      status: 'published',
    }).select('title metaDescription featuredImage').lean();

    if (!article) {
      return { title: 'Article Not Found' };
    }

    const name = doctor.displayName || doctor.name;
    const description = article.metaDescription || `An article by ${name}.`;
    const base = await tenantBase();
    return {
      ...(base ? { metadataBase: new URL(base) } : {}),
      title: `${article.title} — ${name}`,
      description,
      alternates: { canonical: `/blog/${slug}` },
      openGraph: {
        title: article.title,
        description,
        url: `/blog/${slug}`,
        type: 'article',
        images: article.featuredImage?.url ? [article.featuredImage.url] : [],
      },
    };
  } catch {
    return { title: 'Article' };
  }
}

export default async function DoctorBlogArticlePage({ params }) {
  const { subdomain, slug } = await params;

  await connectDB();

  const doctor = await Doctor.findOne({
    subdomain: subdomain.toLowerCase(),
    isActive: true,
    isEmailVerified: true,
  }).select('-password -emailOTP -emailOTPExpiry').lean();

  if (!doctor) {
    notFound();
  }

  // Scope strictly by doctorId so one doctor never serves another's article, and
  // increment the view count in the same atomic operation.
  const article = await BlogArticle.findOneAndUpdate(
    { doctorId: doctor._id, slug, status: 'published' },
    { $inc: { 'analytics.views': 1 } },
    { new: true }
  ).lean();

  if (!article) {
    notFound();
  }

  const doctorName = doctor.displayName || doctor.name;
  const authorName = article.author?.name || doctorName;
  const spec = article.specialistSection;
  const audit = article.surgicalAuditSection;
  const faqs = article.faqSection?.faqs?.filter((f) => f.question && f.answer) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-gray-600 hover:text-[#096b17] text-sm font-medium mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Resources
          </Link>

          {article.category && (
            <span className="inline-block px-3 py-1 bg-[#096b17]/10 text-[#096b17] text-xs font-medium rounded mb-3">
              {article.category}
            </span>
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="font-medium">{authorName}</span>
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
          {article.problemSection?.content && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-[#096b17]">
                {article.problemSection.heading || 'Overview'}
              </h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {article.problemSection.content}
              </div>
            </section>
          )}

          {article.clinicalSection?.content && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-[#096b17]">
                {article.clinicalSection.heading}
              </h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {article.clinicalSection.content}
              </div>
            </section>
          )}

          {spec?.content && (
            <section className="bg-[#096b17]/5 rounded-lg p-6 border-l-4 border-[#096b17]">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {spec.heading}
              </h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line mb-6">
                {spec.content}
              </div>

              {(spec.stats?.surgeriesPerformed || spec.stats?.proceduresSupervised) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center border border-[#096b17]/20">
                    <div className="text-3xl font-bold text-[#096b17] mb-1">
                      {spec.stats?.surgeriesPerformed || 0}+
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Surgeries Performed</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center border border-[#096b17]/20">
                    <div className="text-3xl font-bold text-[#096b17] mb-1">
                      {spec.stats?.proceduresSupervised || 0}+
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Procedures Supervised</div>
                  </div>
                </div>
              )}
            </section>
          )}

          {article.complexCasesSection?.content && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-[#096b17]">
                {article.complexCasesSection.heading}
              </h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {article.complexCasesSection.content}
              </div>
            </section>
          )}

          {audit?.content && (
            <section className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {audit.heading}
              </h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line mb-6">
                {audit.content}
              </div>

              {audit.auditSteps && audit.auditSteps.length > 0 && (
                <div className="space-y-3">
                  {audit.auditSteps.map((step, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-[#096b17] text-white rounded-full flex items-center justify-center font-bold text-sm">
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
            </section>
          )}

          {faqs.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-[#096b17]">
                {article.faqSection?.heading || 'FAQs'}
              </h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-5">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-start gap-2">
                      <span className="text-[#096b17] flex-shrink-0">Q{index + 1}.</span>
                      <span>{faq.question}</span>
                    </h3>
                    <div className="pl-6 text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                      {faq.answer}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CTA — links back to the doctor's own site */}
          <section className="bg-[#096b17] text-white rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Ready to book an appointment?</h2>
            <p className="mb-4 opacity-90">Consult with {doctorName}.</p>
            <Link
              href="/"
              className="inline-block bg-white text-[#096b17] hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Book an appointment
            </Link>
          </section>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[#096b17] hover:text-[#075110] font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to all resources
          </Link>
        </div>
      </main>
    </div>
  );
}
