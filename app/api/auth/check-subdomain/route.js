import { NextResponse } from 'next/server';
import { checkSubdomainAvailability, isValidSubdomain } from '@/lib/doctorAuth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { subdomain } = body;

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    // First check format
    if (!isValidSubdomain(subdomain)) {
      return NextResponse.json({
        available: false,
        reason: 'Invalid format. Use only lowercase letters, numbers, and hyphens (3-30 characters)',
      });
    }

    // Then check availability
    const result = await checkSubdomainAvailability(subdomain);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Check subdomain error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// Also support GET for quick checks
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    if (!isValidSubdomain(subdomain)) {
      return NextResponse.json({
        available: false,
        reason: 'Invalid format',
      });
    }

    const result = await checkSubdomainAvailability(subdomain);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Check subdomain error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
