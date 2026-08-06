import { notFound, redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import BookingPage from '@/models/BookingPage';
import SiteBody from '../_SiteBody';

// Generate metadata
export async function generateMetadata({ params }) {
  const { subdomain, slug } = await params;

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
      slug,
      status: 'published',
    }).lean();

    if (!bookingPage) {
      return {
        title: 'Page Not Found',
      };
    }

    return {
      title: bookingPage.title || `${doctor.displayName || doctor.name}`,
      description: bookingPage.metaDescription || `Book an appointment with ${doctor.displayName || doctor.name}`,
      alternates: { canonical: '/' + slug },
      openGraph: {
        title: bookingPage.title || doctor.displayName || doctor.name,
        description: bookingPage.metaDescription || `Book an appointment with ${doctor.displayName || doctor.name}`,
        images: bookingPage.ogImage ? [bookingPage.ogImage] : [],
      },
    };
  } catch {
    return {
      title: 'Curago',
    };
  }
}

export default async function SubdomainSlugPage({ params }) {
  const { subdomain, slug } = await params;

  await connectDB();

  // Find doctor by subdomain (match the homepage's filter)
  const doctor = await Doctor.findOne({
    subdomain: subdomain.toLowerCase(),
    isActive: true,
    isEmailVerified: true,
  }).select('-password -emailOTP -emailOTPExpiry').lean();

  if (!doctor) {
    notFound();
  }

  // Find the requested published page for this doctor
  const bookingPage = await BookingPage.findOne({
    doctorId: doctor._id,
    slug,
    status: 'published',
  }).lean();

  if (!bookingPage) {
    notFound();
  }

  // Dedupe: the homepage renders the FIRST published page (by createdAt) at `/`.
  // If this slug points at that same page, redirect to `/` so we don't serve
  // identical content at two URLs.
  const homepagePage = await BookingPage.findOne({
    doctorId: doctor._id,
    status: 'published',
  }).sort({ createdAt: 1 }).select('_id').lean();

  if (homepagePage && String(homepagePage._id) === String(bookingPage._id)) {
    redirect('/');
  }

  // Increment views
  await BookingPage.findByIdAndUpdate(bookingPage._id, {
    $inc: { views: 1 }
  });

  return <SiteBody doctor={JSON.parse(JSON.stringify(doctor))} bookingPage={bookingPage} />;
}
