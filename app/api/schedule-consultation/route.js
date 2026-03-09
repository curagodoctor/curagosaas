import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();

    // Prepare submission data
    const submissionData = {
      name: data.name,
      phoneNumber: data.whatsapp,
      email: data.email,
      consultationType: data.consultationType,
      preferredDate: data.date,
      preferredTime: data.time,
      timestamp: new Date().toISOString()
    };

    // Send to webhook
    const webhookPromise = fetch('https://server.wylto.com/webhook/XLuJDKiLWjA5j49Y8S', {
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
