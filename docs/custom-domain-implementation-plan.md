# Custom Domain Support for Doctor Websites

## Overview
Allow doctors to use their own domain (e.g., `drsmith.com`) instead of the subdomain (`drsmith.curago.in`) for their booking websites.

## User Requirements (Confirmed)
- **Setup Method**: Admin dashboard UI - doctors enter domain in settings, see DNS instructions
- **Verification**: DNS verification required (TXT record to prove ownership)
- **Hosting**: Vercel (SSL handled automatically)

---

## Current State

**Already exists:**
- `customDomain` field in Doctor model (nullable string)
- Middleware handles subdomain routing via `middleware.js`
- `/site/[subdomain]/page.js` renders doctor websites

**Needs implementation:**
- DNS verification logic
- API endpoints for domain management
- Dashboard UI for domain configuration
- Middleware update to route custom domains
- Vercel domain configuration

---

## Implementation Plan

### Part 1: Update Doctor Model

**File:** `models/Doctor.js`

Add verification fields to support DNS verification:

```javascript
// Existing field
customDomain: {
  type: String,
  trim: true,
  lowercase: true,
  default: null
},

// NEW: Add these fields
customDomainVerified: {
  type: Boolean,
  default: false
},
customDomainVerificationToken: {
  type: String,
  default: null  // Random token for TXT record verification
},
customDomainAddedAt: {
  type: Date,
  default: null
}
```

---

### Part 2: Create Domain Management API

**New File:** `app/api/doctor/custom-domain/route.js`

**Endpoints:**

```javascript
// GET - Get current domain status
{
  customDomain: "drsmith.com" | null,
  verified: true | false,
  verificationToken: "curago-verify-abc123",
  instructions: "Add TXT record: curago-verify=abc123"
}

// POST - Add/update custom domain
// Request: { domain: "drsmith.com" }
// - Validate domain format
// - Check domain not already used by another doctor
// - Generate verification token
// - Return DNS instructions

// DELETE - Remove custom domain
// - Clear customDomain fields
// - (Optional) Remove from Vercel via API
```

**New File:** `app/api/doctor/custom-domain/verify/route.js`

```javascript
// POST - Verify domain ownership
// - Perform DNS TXT lookup for verification token
// - If verified: set customDomainVerified = true
// - If not verified: return helpful error message
```

---

### Part 3: DNS Verification Logic

**New File:** `lib/domainVerification.js`

```javascript
import dns from 'dns/promises';

// Generate unique verification token
export function generateVerificationToken(doctorId) {
  return `curago-verify-${doctorId.toString().slice(-8)}-${randomString(8)}`;
}

// Verify TXT record exists
export async function verifyDomainOwnership(domain, expectedToken) {
  try {
    const records = await dns.resolveTxt(domain);
    // Check for: curago-verify=<token> OR _curago.<domain> TXT record
    const flatRecords = records.flat();
    return flatRecords.some(r => r.includes(expectedToken));
  } catch (error) {
    return false;
  }
}

// Validate domain format
export function isValidDomain(domain) {
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
  return domainRegex.test(domain);
}
```

---

### Part 4: Update Middleware for Custom Domains

**File:** `middleware.js`

Add custom domain lookup BEFORE subdomain logic:

```javascript
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const hostname = request.headers.get('host');

  // Skip for main domain and known paths
  if (isMainDomain(hostname) || isSystemPath(request.pathname)) {
    return NextResponse.next();
  }

  // 1. Check if it's a custom domain (not *.curago.in)
  if (!hostname.endsWith('.curago.in') && !hostname.includes('localhost')) {
    // Look up custom domain in database
    // Note: Need edge-compatible DB query (can use API route or edge-compatible client)
    const response = await fetch(`${getBaseUrl()}/api/internal/lookup-domain?domain=${hostname}`);
    const data = await response.json();

    if (data.subdomain) {
      // Rewrite to /site/[subdomain]
      return NextResponse.rewrite(
        new URL(`/site/${data.subdomain}`, request.url)
      );
    }
  }

  // 2. Existing subdomain logic
  const subdomain = extractSubdomain(hostname);
  if (subdomain) {
    return NextResponse.rewrite(
      new URL(`/site/${subdomain}`, request.url)
    );
  }

  return NextResponse.next();
}
```

**New File:** `app/api/internal/lookup-domain/route.js`

```javascript
// Internal API for middleware to lookup custom domains
// Returns: { subdomain: "drsmith" } or { subdomain: null }
// Only returns verified domains
```

---

### Part 5: Dashboard UI - Domain Settings

**File:** `app/admin/dashboard/settings/page.js`

Add Custom Domain section to existing settings page:

```jsx
<section className="bg-white rounded-lg shadow p-6">
  <h3 className="text-lg font-semibold mb-4">Custom Domain</h3>

  {!customDomain ? (
    // Add domain form
    <div>
      <input
        placeholder="yourdomain.com"
        value={newDomain}
        onChange={...}
      />
      <button onClick={handleAddDomain}>Add Domain</button>
    </div>
  ) : (
    // Show domain status
    <div>
      <p>Domain: {customDomain}</p>
      <p>Status: {verified ? '✅ Verified' : '⏳ Pending Verification'}</p>

      {!verified && (
        <div className="bg-yellow-50 p-4 rounded mt-4">
          <h4>DNS Configuration Required</h4>
          <p>Add this TXT record to your domain:</p>
          <code>curago-verify={verificationToken}</code>
          <button onClick={handleVerify}>Verify Now</button>
        </div>
      )}

      <button onClick={handleRemoveDomain}>Remove Domain</button>
    </div>
  )}
</section>
```

---

### Part 6: Vercel Domain Configuration

**Option A: Manual (Recommended for now)**
- Doctor adds domain in dashboard
- After verification, show instructions:
  1. "Add CNAME record pointing to `cname.vercel-dns.com`"
  2. "Email support@curago.in to complete setup"
- Admin manually adds domain in Vercel dashboard

**Option B: Vercel API (Future enhancement)**
```javascript
// Use Vercel API to add domain automatically
// Requires: VERCEL_TOKEN and PROJECT_ID env vars
await fetch('https://api.vercel.com/v10/projects/{projectId}/domains', {
  method: 'POST',
  headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
  body: JSON.stringify({ name: 'drsmith.com' })
});
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `models/Doctor.js` | MODIFY | Add verification fields |
| `lib/domainVerification.js` | **CREATE** | DNS verification utilities |
| `app/api/doctor/custom-domain/route.js` | **CREATE** | Domain CRUD endpoints |
| `app/api/doctor/custom-domain/verify/route.js` | **CREATE** | Verification endpoint |
| `app/api/internal/lookup-domain/route.js` | **CREATE** | Internal lookup for middleware |
| `middleware.js` | MODIFY | Add custom domain routing |
| `app/admin/dashboard/settings/page.js` | MODIFY | Add domain settings UI |

---

## DNS Instructions for Doctors

When a doctor adds their domain, show:

```
📋 DNS Configuration Steps

1. Add a TXT record to verify ownership:
   Type: TXT
   Name: @ (or yourdomain.com)
   Value: curago-verify=<token>

2. After verification, add a CNAME record:
   Type: CNAME
   Name: @ (or www)
   Value: cname.vercel-dns.com

3. Wait 5-10 minutes for DNS propagation

4. Click "Verify" to complete setup
```

---

## Implementation Order

1. [ ] Update Doctor model with verification fields
2. [ ] Create `lib/domainVerification.js` utilities
3. [ ] Create domain management API endpoints
4. [ ] Create internal lookup API for middleware
5. [ ] Update middleware to route custom domains
6. [ ] Add domain settings UI to dashboard
7. [ ] Test end-to-end flow
8. [ ] Document Vercel domain setup process

---

## Security Considerations

- Verify domain ownership before activating (prevents domain hijacking)
- Rate limit verification attempts
- Only serve verified domains
- Sanitize domain input (prevent injection)
- Use HTTPS only (Vercel handles this)

---

## Edge Cases

- Domain already used by another doctor → Error message
- DNS not propagated yet → "Try again in a few minutes"
- Invalid domain format → Client-side validation
- Doctor deletes account → Domain automatically removed
- Multiple domains per doctor → Future enhancement (start with one)
