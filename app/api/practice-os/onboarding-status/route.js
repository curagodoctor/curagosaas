import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePracticeOsDoctor } from '@/lib/practice-os/access';
import PracticeOsProfile from '@/models/practice-os/PracticeOsProfile';
import BookingPage from '@/models/BookingPage';
import BlogArticle from '@/models/BlogArticle';
import { getConnectionStatus } from '@/lib/gmb';

export const runtime = 'nodejs';

// GET — live completion status of the free setup funnel (§2), used to drive the
// guided setup checklist. Each flag is derived from real data so a step never
// shows "to do" once it's genuinely done (and vice versa).
export async function GET(request) {
  try {
    const doctor = await requirePracticeOsDoctor(request);
    await connectDB();

    const [profile, homePage, blogCount, gmb] = await Promise.all([
      PracticeOsProfile.findOne({ doctorId: doctor._id }).select('credentials.extracted credentials.summary').lean(),
      BookingPage.findOne({ doctorId: doctor._id, slug: 'home' }).select('aiGeneratedAt userEdited status').lean(),
      BlogArticle.countDocuments({ doctorId: doctor._id }),
      getConnectionStatus(doctor._id).catch(() => ({ connected: false })),
    ]);

    const subdomain = doctor.subdomain || '';
    const profileBuilt = !!(profile && ((profile.credentials?.extracted || []).length > 0 || profile.credentials?.summary));
    // "Generated your website" = the AI builder produced the home page (a bare
    // seeded default doesn't count as done).
    const websiteReady = !!(homePage && homePage.aiGeneratedAt);
    const firstBlog = blogCount > 0;
    const gbpConnected = !!gmb?.connected;

    return NextResponse.json({
      success: true,
      steps: {
        subdomain: !!subdomain,
        profileBuilt,
        websiteReady,
        firstBlog,
        gbpConnected,
      },
      subdomainName: subdomain,
    });
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    console.error('[practice-os onboarding-status]', error);
    return NextResponse.json({ success: false, error: 'Failed to load status' }, { status: 500 });
  }
}
