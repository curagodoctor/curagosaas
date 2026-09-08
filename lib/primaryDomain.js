// The ONE canonical origin for a doctor's public site.
//
// A doctor can be reachable at two hosts — their CuraGo subdomain
// ({sub}.curago.in) and, once connected, a custom domain (drrao.com). To avoid
// duplicate-content, every public URL (canonical, og:url, sitemap, robots,
// internal links) must be built from a single PRIMARY domain, no matter which
// host actually served the request.
//
// Rule: a custom domain is primary ONLY once it's verified as actually serving
// (customDomainVerified). Until then the subdomain stays primary, so we never
// point canonicals/redirects at a domain whose DNS/SSL isn't live yet.

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'curago.in';

function cleanHost(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
}

// The bare hostname of the doctor's primary domain (no scheme). Null if the
// doctor has no public site yet.
export function primaryHost(doctor) {
  if (doctor?.customDomain && doctor?.customDomainVerified) {
    return cleanHost(doctor.customDomain);
  }
  if (doctor?.subdomain) return `${doctor.subdomain}.${ROOT_DOMAIN}`;
  return null;
}

// Full origin (scheme + host) for the doctor's primary domain. Null if none.
export function primaryBaseUrl(doctor) {
  const host = primaryHost(doctor);
  if (!host) return null;
  const proto = host.includes('localhost') ? 'http' : 'https';
  return `${proto}://${host}`;
}
