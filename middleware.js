import { NextResponse } from 'next/server';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'curago.in';

/**
 * Extract subdomain from hostname
 * @param {string} hostname - e.g., "dr-yuvaraj.curago.in" or "localhost:3000"
 * @returns {string|null} - subdomain or null
 */
function extractSubdomain(hostname) {
  // Remove port if present
  const host = hostname.split(':')[0];

  // Handle localhost for development
  if (host === 'localhost' || host === '127.0.0.1') {
    return null;
  }

  // Handle Vercel preview deployments
  if (host.endsWith('.vercel.app')) {
    return null;
  }

  // Extract subdomain from root domain
  // e.g., "dr-yuvaraj.curago.in" -> "dr-yuvaraj"
  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = host.replace(`.${ROOT_DOMAIN}`, '');
    // Don't treat www as a subdomain
    if (subdomain && subdomain !== 'www') {
      return subdomain;
    }
  }

  // Handle direct root domain access
  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) {
    return null;
  }

  return null;
}

export function middleware(request) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Files with extensions (images, etc.)
  ) {
    return NextResponse.next();
  }

  // Extract subdomain
  const subdomain = extractSubdomain(hostname);

  // If we have a subdomain, rewrite to the site route
  if (subdomain) {
    // admin.curago.in -> /platform-admin routes (future)
    if (subdomain === 'admin') {
      return NextResponse.rewrite(
        new URL(`/platform-admin${pathname}`, request.url)
      );
    }

    // {doctor}.curago.in -> /site/[subdomain] routes
    // This renders the doctor's public website
    const newUrl = new URL(`/site/${subdomain}${pathname}`, request.url);

    // Pass subdomain as a header for server components to access
    const response = NextResponse.rewrite(newUrl);
    response.headers.set('x-subdomain', subdomain);

    return response;
  }

  // No subdomain - main site (curago.in)
  // Let the request continue to normal routes
  return NextResponse.next();
}

export const config = {
  // Match all paths except API, static files, and Next.js internals
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/*)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public files (public/*)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
