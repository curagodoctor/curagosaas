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
  const { subdomain } = await params;

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

    const name = doctor.displayName || doctor.name;
    const base = await tenantBase();
    return {
      ...(base ? { metadataBase: new URL(base) } : {}),
      title: `Resources — ${name}`,
      description: `Articles and health resources from ${name}.`,
      alternates: { canonical: '/blog' },
      openGraph: {
        title: `Resources — ${name}`,
        description: `Articles and health resources from ${name}.`,
        url: '/blog',
      },
    };
  } catch {
    return { title: 'Resources' };
  }
}

export default async function DoctorBlogListPage({ params }) {
  const { subdomain } = await params;

  await connectDB();

  const doctor = await Doctor.findOne({
    subdomain: subdomain.toLowerCase(),
    isActive: true,
    isEmailVerified: true,
  }).select('-password -emailOTP -emailOTPExpiry').lean();

  if (!doctor) {
    notFound();
  }

  const articles = await BlogArticle.find({
    doctorId: doctor._id,
    status: 'published',
  })
    .sort({ publishedAt: -1 })
    .select('title slug category metaDescription featuredImage publishedAt analytics')
    .lean();

  const doctorName = doctor.displayName || doctor.name;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            {doctor.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doctor.profileImage}
                alt={doctorName}
                className="h-10 w-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <span className="h-10 w-10 rounded-full bg-[#096b17]/10 text-[#096b17] flex items-center justify-center font-bold flex-shrink-0">
                {doctorName?.charAt(0)?.toUpperCase()}
              </span>
            )}
            <span className="font-semibold text-gray-900 truncate">{doctorName}</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-[#096b17] transition-colors whitespace-nowrap"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      {/* Title */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-4">
        <p className="text-xs font-medium uppercase tracking-wider text-[#096b17] mb-2">Resources</p>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Articles &amp; Health Resources
        </h1>
        <p className="mt-2 text-gray-600">Written by {doctorName}.</p>
      </div>

      {/* Articles Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {articles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">No articles yet</h2>
            <p className="text-gray-600">Check back soon for new resources.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={String(article._id)}
                href={`/blog/${article.slug}`}
                className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-[#096b17] hover:shadow-lg transition-all duration-300"
              >
                {article.featuredImage?.url ? (
                  <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.featuredImage.url}
                      alt={article.featuredImage.alt || article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-gradient-to-br from-[#096b17] to-[#075110] flex items-center justify-center">
                    <svg className="w-12 h-12 text-white opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )}

                <div className="p-4">
                  {article.category && (
                    <span className="inline-block px-2.5 py-0.5 bg-[#096b17]/10 text-[#096b17] text-xs font-medium rounded mb-2">
                      {article.category}
                    </span>
                  )}

                  <h2 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#096b17] transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h2>

                  {article.metaDescription && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
                      {article.metaDescription}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <span>{formatDate(article.publishedAt)}</span>
                    <span>{article.analytics?.views || 0} views</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-gray-500">
          Powered by <span className="text-[#096b17] font-medium">CuraGo</span>
        </div>
      </footer>
    </div>
  );
}
