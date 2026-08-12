import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { addDomain, removeDomain, getDomainConfig } from '@/lib/vercelDomains';

// GET — get current domain status
export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    if (!doctor.customDomain) {
      return NextResponse.json({
        success: true,
        domain: null,
        subdomain: doctor.subdomain,
      });
    }

    // Check domain config on Vercel
    const config = await getDomainConfig(doctor.customDomain);

    return NextResponse.json({
      success: true,
      domain: doctor.customDomain,
      subdomain: doctor.subdomain,
      ...config,
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Domain GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch domain status' }, { status: 500 });
  }
}

// POST — add a custom domain
export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const { domain } = await request.json();

    if (!domain || !domain.trim()) {
      return NextResponse.json({ success: false, error: 'Domain is required' }, { status: 400 });
    }

    // Normalise: strip scheme, trailing slash, and a leading "www." so we always
    // store/serve the registrable apex (the www variant is registered separately
    // by addDomain and redirects to the apex).
    const cleanDomain = domain
      .trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '')
      .replace(/^www\./, '');

    // Basic domain validation
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(cleanDomain)) {
      return NextResponse.json({ success: false, error: 'Invalid domain format' }, { status: 400 });
    }

    // Remove old domain if changing
    if (doctor.customDomain && doctor.customDomain !== cleanDomain) {
      await removeDomain(doctor.customDomain);
    }

    // Add domain to Vercel
    const result = await addDomain(cleanDomain);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    // Save to doctor record
    await Doctor.findByIdAndUpdate(doctor._id, { customDomain: cleanDomain });

    // Get DNS records the doctor needs to add
    const config = await getDomainConfig(cleanDomain);

    return NextResponse.json({
      success: true,
      domain: cleanDomain,
      alreadyExists: result.alreadyExists || false,
      ...config,
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Domain POST]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to add domain' }, { status: 500 });
  }
}

// DELETE — remove custom domain
export async function DELETE(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    if (!doctor.customDomain) {
      return NextResponse.json({ success: false, error: 'No custom domain set' }, { status: 400 });
    }

    await removeDomain(doctor.customDomain);
    await Doctor.findByIdAndUpdate(doctor._id, { customDomain: null });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Domain DELETE]', error);
    return NextResponse.json({ success: false, error: 'Failed to remove domain' }, { status: 500 });
  }
}
