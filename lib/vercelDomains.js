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

// Add a custom domain to the Vercel project
export async function addDomain(domain) {
  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    return { success: false, error: 'Vercel API not configured' };
  }

  try {
    const { data, status } = await vercelRequest(
      `/v10/projects/${VERCEL_PROJECT_ID}/domains`,
      'POST',
      { name: domain }
    );

    if (status === 409) {
      // Domain already added
      return { success: true, alreadyExists: true };
    }

    return { success: true, domain: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Remove a custom domain from the Vercel project
export async function removeDomain(domain) {
  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    return { success: false, error: 'Vercel API not configured' };
  }

  try {
    await vercelRequest(
      `/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`,
      'DELETE'
    );
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

// Determine required DNS records based on domain type
function getRequiredRecords(domain, configData) {
  const isSubdomain = domain.split('.').length > 2; // e.g., www.example.com

  if (isSubdomain) {
    return [{
      type: 'CNAME',
      name: domain.split('.')[0], // 'www'
      value: 'cname.vercel-dns.com',
      ttl: 3600,
    }];
  }

  // Apex domain (e.g., example.com) — needs A record
  return [{
    type: 'A',
    name: '@',
    value: '76.76.21.21',
    ttl: 3600,
  }];
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
