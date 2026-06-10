import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';

// Public API — no auth required. Used by middleware to resolve custom domains.
// Cached in-memory for performance (middleware calls this on every request).
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain')?.toLowerCase();

    if (!domain) {
      return NextResponse.json({ subdomain: null });
    }

    // Check cache
    const cached = cache.get(domain);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      return NextResponse.json({ subdomain: cached.subdomain });
    }

    await connectDB();

    const doctor = await Doctor.findOne({
      customDomain: domain,
      isActive: true,
    }).select('subdomain').lean();

    const subdomain = doctor?.subdomain || null;

    // Cache the result
    cache.set(domain, { subdomain, time: Date.now() });

    return NextResponse.json({ subdomain });
  } catch (error) {
    console.error('[Domain Lookup]', error);
    return NextResponse.json({ subdomain: null });
  }
}
