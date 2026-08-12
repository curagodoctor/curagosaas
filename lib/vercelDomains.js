const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_API = 'https://api.vercel.com';

async function vercelRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${VERCEL_API}${endpoint}`, options);
  const data = await res.json();

  if (!res.ok && res.status !== 409) { // 409 = domain already exists, not an error
    throw new Error(data.error?.message || `Vercel API error: ${res.status}`);
  }
  return { data, status: res.status };
}

// Common two-label public suffixes, so "example.co.in" / "example.co.uk" are
// recognised as apex domains rather than subdomains. Not the full Public Suffix
// List — just the ones our doctors realistically use (India-weighted).
const MULTI_LABEL_TLDS = new Set([
  'co.in', 'net.in', 'org.in', 'firm.in', 'gen.in', 'ind.in',
  'co.uk', 'org.uk', 'me.uk', 'com.au', 'net.au', 'co.nz',
  'com.br', 'com.sg', 'com.my',
]);

// The registrable apex of a domain, ignoring any leading www./sub labels.
// "www.example.com" -> "example.com"; "clinic.example.co.in" -> "example.co.in".
function apexOf(domain) {
  const parts = domain.split('.');
  if (parts.length <= 2) return domain;
  const lastTwo = parts.slice(-2).join('.');
  const keep = MULTI_LABEL_TLDS.has(lastTwo) ? 3 : 2;
  return parts.slice(-keep).join('.');
}

// True when `domain` IS its own registrable apex (example.com, example.co.in) —
// i.e. has no subdomain in front. www./clinic. etc. are not apex.
function isApex(domain) {
  return domain === apexOf(domain);
}

// Add a custom domain to the Vercel project. We always work from the registrable
// apex and register BOTH the apex and its www. variant (redirecting to the apex),
// so each gets a Vercel SSL cert and https works on either — whether the doctor
// typed "example.com", "www.example.com", or an apex on a .co.in-style TLD. For a
// genuine subdomain (clinic.example.com) we register just that one.
export async function addDomain(input) {
  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    return { success: false, error: 'Vercel API not configured' };
  }

  // Normalise a leading "www." to the apex so both variants get registered.
  const apex = apexOf(input);
  const strippedWww = input.replace(/^www\./, '');
  const domain = strippedWww === apex ? apex : input;

  const targets = isApex(domain)
    ? [{ name: domain }, { name: `www.${domain}`, redirect: domain }]
    : [{ name: domain }];

  try {
    let primary = null;
    for (const body of targets) {
      const { data, status } = await vercelRequest(
        `/v10/projects/${VERCEL_PROJECT_ID}/domains`,
        'POST',
        body,
      );
      if (body.name === domain) primary = { data, alreadyExists: status === 409 };
    }
    return { success: true, alreadyExists: primary?.alreadyExists || false, domain: primary?.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Remove a custom domain (and its www. variant, for an apex domain) from Vercel.
export async function removeDomain(domain) {
  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    return { success: false, error: 'Vercel API not configured' };
  }

  const names = isApex(domain) ? [domain, `www.${domain}`] : [domain];
  try {
    for (const name of names) {
      try {
        await vercelRequest(`/v9/projects/${VERCEL_PROJECT_ID}/domains/${name}`, 'DELETE');
      } catch {
        // A missing www. variant is fine — keep removing the rest.
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get domain configuration and verification status
export async function getDomainConfig(domain) {
  if (!VERCEL_API_TOKEN) {
    return { success: false, error: 'Vercel API not configured' };
  }

  try {
    // Get domain info from project
    const { data: domainData } = await vercelRequest(
      `/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`
    );

    // Get DNS verification status
    const { data: configData } = await vercelRequest(
      `/v6/domains/${domain}/config`
    );

    return {
      success: true,
      verified: domainData.verified || false,
      configured: configData.configured || false,
      misconfigured: configData.misconfigured || false,
      dnsRecords: configData.dnsRecords || [],
      // What the user needs to set
      requiredRecords: getRequiredRecords(domain, configData),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Vercel's current recommended targets. The older A IP (76.76.21.21) still works,
// so existing setups keep functioning, but new doctors are told the current one.
const VERCEL_A_IP = '216.198.79.1';
const VERCEL_CNAME = 'cname.vercel-dns.com';

// The DNS records a doctor needs to add. For a subdomain (www.example.com) it's a
// single CNAME. For an apex domain we return BOTH the apex A record AND the www
// CNAME, so www works and gets its own SSL certificate too.
function getRequiredRecords(domain) {
  if (!isApex(domain)) {
    return [{ type: 'CNAME', name: domain.split('.')[0], value: VERCEL_CNAME, ttl: 3600 }];
  }
  return [
    { type: 'A', name: '@', value: VERCEL_A_IP, ttl: 3600 },
    { type: 'CNAME', name: 'www', value: VERCEL_CNAME, ttl: 3600 },
  ];
}

// Real DNS resolution: is this domain actually pointing at Vercel right now?
// Catches working domains that Vercel's project "verified" flag misses — e.g.
// domains delegated to Vercel nameservers, or added to Vercel at the account
// level. Checks A records (Vercel IPs / anycast ranges), a CNAME to
// *.vercel-dns.com, and Vercel nameservers.
export async function dnsPointsToVercel(domain) {
  const isVercelIp = (ip) =>
    ip === '76.76.21.21' || ip === '216.198.79.1'
    || ip.startsWith('216.198.79.') || ip.startsWith('64.29.17.') || ip.startsWith('76.76.21.');
  const isVercelHost = (h) => /(^|\.)vercel-dns\.com\.?$/i.test(String(h || ''));

  let dns;
  try { dns = await import('dns/promises'); } catch { return { pointsToVercel: false }; }

  let a = [], cname = [], ns = [];
  try { a = await dns.resolve4(domain); } catch { /* no A records */ }
  try { cname = await dns.resolveCname(domain); } catch { /* no CNAME */ }
  try { ns = await dns.resolveNs(domain); } catch { /* no NS */ }

  const usesVercelNs = ns.some(isVercelHost);
  const pointsToVercel = a.some(isVercelIp) || cname.some(isVercelHost) || usesVercelNs;
  // Extra A records that AREN'T Vercel — the classic "half-working" conflict
  // (e.g. a leftover Hostinger A record). Ignored when the domain is delegated to
  // Vercel nameservers, since Vercel owns the zone then.
  const conflictingRecords = usesVercelNs ? [] : a.filter((ip) => !isVercelIp(ip));

  return { pointsToVercel, conflictingRecords, aRecords: a, cname, nameservers: ns };
}

// Verify domain DNS (trigger Vercel to re-check)
export async function verifyDomain(domain) {
  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    return { success: false, error: 'Vercel API not configured' };
  }

  try {
    const { data } = await vercelRequest(
      `/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}/verify`,
      'POST'
    );
    return { success: true, verified: data.verified || false };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
