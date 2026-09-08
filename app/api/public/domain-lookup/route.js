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
      return NextResponse.json(cached.data);
    }

    await connectDB();

    // The domain we're asked about may be the custom domain OR the subdomain host.
    // Resolve either to the owning doctor so middleware can decide the primary host.
    const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'curago.in').toLowerCase();
    const sub = domain.endsWith(`.${rootDomain}`) ? domain.replace(`.${rootDomain}`, '') : null;

    const doctor = await Doctor.findOne(
      sub ? { subdomain: sub, isActive: true } : { customDomain: domain, isActive: true }
    ).select('subdomain customDomain customDomainVerified').lean();

    const data = {
      subdomain: doctor?.subdomain || null,
      customDomain: doctor?.customDomain || null,
      customDomainVerified: !!doctor?.customDomainVerified,
    };

    // Cache the result
    cache.set(domain, { data, time: Date.now() });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Domain Lookup]', error);
    return NextResponse.json({ subdomain: null });
  }
}
