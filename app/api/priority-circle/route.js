import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();

    // Google Apps Script URL
    const googleScriptUrl = 'https://script.google.com/macros/s/AKfycbz2WF9vgRvkeqjsRbsIucVSNnklKV0dJWt-lzyeIPnmdVTI8uAful4qdyFHLGuAkymA/exec';

    // Send to Google Apps Script
    const googleScriptResponse = await fetch(googleScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        testType: 'priority_circle',
        ...data
      })
    });

    const result = await googleScriptResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Data submitted successfully',
      googleScriptResult: result
    });

  } catch (error) {
    console.error('Error in priority-circle API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
