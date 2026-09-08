// Is a custom domain SAFE to treat as primary (i.e. safe to 301 the subdomain to)?
//
// The only trustworthy answer is: does it actually serve OUR rendered site over
// HTTPS right now? Vercel's "configured"/"verified" flags are not enough — they
// can report true while the TLS cert is still provisioning, which would make us
// redirect a live subdomain into a domain that returns nothing. And a domain can
// return 200 while serving a completely different site (a parked page, another
// app), so we also require a CuraGo signature in the HTML.
export async function domainServesOurSite(domain) {
  const host = String(domain || '')
    .trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
  if (!host) return false;

  try {
    const res = await fetch(`https://${host}/`, {
      redirect: 'follow',
      headers: { 'User-Agent': 'CuraGo-DomainCheck/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return false; // non-200 (or dead TLS -> throws) => not live
    const html = await res.text();
    // Signatures unique to a CuraGo-rendered doctor site (a foreign 200 page,
    // even another Next.js app, won't carry these).
    return /curago/i.test(html)
      || html.includes('id="booking_form"')
      || html.includes('Book Your Slot');
  } catch {
    return false; // DNS/TLS/timeout failure => definitely not safe to redirect to
  }
}
