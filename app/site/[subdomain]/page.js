import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import BookingPage from '@/models/BookingPage';
import SiteBody from './_SiteBody';

// The tenant's own origin (subdomain or custom domain), from the request host.
// Used as metadataBase so canonical/OG URLs point at the DOCTOR's site, not curago.in.
async function tenantBase() {
  const h = await headers();
  const host = h.get('host') || '';
  const proto = h.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return host ? `${proto}://${host}` : null;
}

// Generate metadata
export async function generateMetadata({ params }) {
  const { subdomain } = await params;

  try {
    await connectDB();

    const doctor = await Doctor.findOne({
      subdomain: subdomain.toLowerCase(),
      isActive: true,
    }).lean();

    if (!doctor) {
      return {
        title: 'Site Not Found',
      };
    }

    const bookingPage = await BookingPage.findOne({
      doctorId: doctor._id,
      status: 'published',
    }).lean();

    const base = await tenantBase();
    return {
      // Override the app-wide curago.in metadataBase so relative canonical/OG
      // URLs resolve to THIS doctor's own domain.
      ...(base ? { metadataBase: new URL(base) } : {}),
      title: bookingPage?.title || `${doctor.displayName || doctor.name} - Book Appointment`,
      description: bookingPage?.metaDescription || `Book an appointment with ${doctor.displayName || doctor.name}`,
      alternates: { canonical: '/' },
      openGraph: {
        title: bookingPage?.title || doctor.displayName || doctor.name,
        description: bookingPage?.metaDescription || `Book an appointment with ${doctor.displayName || doctor.name}`,
        url: '/',
        images: bookingPage?.ogImage ? [bookingPage.ogImage] : [],
      },
    };
  } catch {
    return {
      title: 'Curago',
    };
  }
}

export default async function SubdomainSitePage({ params }) {
  const { subdomain } = await params;

  await connectDB();

  // Find doctor by subdomain
  const doctor = await Doctor.findOne({
    subdomain: subdomain.toLowerCase(),
    isActive: true,
    isEmailVerified: true,
  }).select('-password -emailOTP -emailOTPExpiry').lean();

  if (!doctor) {
    notFound();
  }

  // Get the main booking page for this doctor
  const bookingPage = await BookingPage.findOne({
    doctorId: doctor._id,
    status: 'published',
  }).sort({ createdAt: 1 }).lean();

  // Increment views
  if (bookingPage) {
    await BookingPage.findByIdAndUpdate(bookingPage._id, {
      $inc: { views: 1 }
    });
  }

  // If no page exists yet, show a plain default page
  if (!bookingPage || !bookingPage.sections || bookingPage.sections.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-[#096b17]/10 rounded-full mx-auto mb-6 flex items-center justify-center">
            {doctor.profileImage ? (
              <img
                src={doctor.profileImage}
                alt={doctor.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-[#096b17]">
                {(doctor.displayName || doctor.name)?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {doctor.displayName || doctor.name}&apos;s Clinic
          </h1>

          <a
            href={`tel:+91${doctor.phone}`}
            className="inline-flex items-center gap-2 mt-6 bg-[#096b17] hover:bg-[#075110] text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Contact Clinic
          </a>
          <p className="mt-2 text-gray-500">{doctor.phone}</p>

          <p className="mt-8 text-sm text-gray-400">
            Powered by <span className="text-[#096b17] font-medium">CuraGo</span>
          </p>
        </div>
      </div>
    );
  }

  // Convert doctor to plain object for client components
  const doctorData = JSON.parse(JSON.stringify(doctor));

  return <SiteBody doctor={doctorData} bookingPage={bookingPage} />;
}
