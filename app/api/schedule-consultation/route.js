import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';

// Extract subdomain from request
function getSubdomainFromRequest(request) {
  const host = request.headers.get('host') || '';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'curago.in';

  if (host.includes('localhost')) {
    return null;
  }

  if (host.endsWith(rootDomain)) {
    const subdomain = host.replace(`.${rootDomain}`, '').split(':')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== rootDomain) {
      return subdomain;
    }
  }

  return null;
}

export async function POST(request) {
  try {
    const data = await request.json();

    // Fetch doctor info for webhook (from subdomain)
    await connectDB();
    let doctorInfo = { phone: '', name: '', subdomain: '' };
    const subdomain = getSubdomainFromRequest(request);
    if (subdomain) {
      const doctor = await Doctor.findOne({ subdomain, isActive: true });
      if (doctor) {
        doctorInfo = {
          phone: doctor.whatsappNumber || doctor.phone || '',
          name: doctor.displayName || doctor.name || '',
          subdomain: doctor.subdomain || '',
        };
      }
    }

    // Prepare submission data
    const submissionData = {
      name: data.name,
      phoneNumber: data.whatsapp,
      email: data.email,
      consultationType: data.consultationType,
      preferredDate: data.date,
      preferredTime: data.time,
      timestamp: new Date().toISOString(),
      // Doctor info for routing
      doctorPhone: doctorInfo.phone,
      doctorName: doctorInfo.name,
      doctorSubdomain: doctorInfo.subdomain,
    };

    // Send to webhook
    const webhookPromise = fetch('https://server.wylto.com/webhook/CMTvOkb2eV0fi8SCxd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData)
    });

    // Send to Google Apps Script
    const googleScriptUrl = 'https://script.google.com/macros/s/AKfycbz2WF9vgRvkeqjsRbsIucVSNnklKV0dJWt-lzyeIPnmdVTI8uAful4qdyFHLGuAkymA/exec';
    const googleScriptPromise = fetch(googleScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        testType: 'consultation_booking',
        ...submissionData
      })
    });

    // Wait for both requests
    await Promise.all([webhookPromise, googleScriptPromise]);

    return NextResponse.json({
      success: true,
      message: 'Consultation booking submitted successfully'
    });

  } catch (error) {
    console.error('Error in schedule-consultation API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
