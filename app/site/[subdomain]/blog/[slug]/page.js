import Link from 'next/link';
import { notFound } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import BlogArticle from '@/models/BlogArticle';
import { primaryBaseUrl } from '@/lib/primaryDomain';
import { getSiteChrome } from '../../_siteChrome';
import SiteChrome from '@/components/booking-page/SiteChrome';

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
    const base = primaryBaseUrl(doctor);
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
  const faqs = article.faqSection?.faqs?.filter((f) => f.question && f.answer) || [];
  const socialLinks = (article.socialLinks || []).filter((l) => l.url && l.url.trim());

  // Fill {{doctor_name}} / {{city}} tokens used in modular blog copy.
  const vars = { doctor_name: doctorName || '', city: article.location?.city || doctor.city || '' };
  const fill = (t) => String(t || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ''));

  // Modular content blocks; fall back to the legacy fixed sections for older
  // articles so existing published blogs keep rendering unchanged.
  const legacyBlocks = [article.problemSection, article.clinicalSection, article.specialistSection, article.complexCasesSection, article.surgicalAuditSection]
    .filter((s) => s && s.content && s.content.trim())
    .map((s) => ({ heading: s.heading || '', content: s.content }));
  const blocks = (article.blocks && article.blocks.length)
    ? article.blocks.filter((b) => (b.heading && b.heading.trim()) || (b.content && b.content.trim()))
    : legacyBlocks;
  const locationBlock = article.locationBlock && (article.locationBlock.heading?.trim() || article.locationBlock.content?.trim())
    ? article.locationBlock
    : null;

  const chrome = await getSiteChrome(doctor);

  return (
    <SiteChrome header={chrome.header} footer={chrome.footer} navSections={chrome.navSections} extraNavLinks={chrome.extraNavLinks} doctor={doctor} themeId={chrome.themeId}>
      <div className="bg-white">
      {/* Article title block */}
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
          {/* Modular content blocks (falls back to legacy sections) */}
          {blocks.map((b, index) => (
            <section key={index}>
              {b.heading && b.heading.trim() && (
                <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-[#096b17]">
                  {fill(b.heading)}
                </h2>
              )}
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {fill(b.content)}
              </div>
            </section>
          ))}

          {/* Clinic location block */}
          {locationBlock && (
            <section className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {fill(locationBlock.heading) || 'Clinic Location & Consultation Information'}
              </h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {fill(locationBlock.content)}
              </div>
            </section>
          )}

          {faqs.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-[#096b17]">
                {article.faqSection?.heading || 'Frequently Asked Questions'}
              </h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-5">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-start gap-2">
                      <span className="text-[#096b17] flex-shrink-0">Q{index + 1}.</span>
                      <span>{fill(faq.question)}</span>
                    </h3>
                    <div className="pl-6 text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                      {fill(faq.answer)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* §10 — social media links (reels / posts) */}
          {socialLinks.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Watch &amp; follow</h2>
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-800 hover:border-[#096b17] hover:text-[#096b17] transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    {link.label || 'View'}
                  </a>
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
    </SiteChrome>
  );
}
