import { NextResponse } from 'next/server';
import { exchangeCodeForTokens, getAccounts, getLocations } from '@/lib/gmb';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import GmbConnection from '@/models/GmbConnection';
import ReviewRequestTemplate from '@/models/ReviewRequestTemplate';

// Temporary storage for OAuth tokens during location selection
// In production, use Redis or database
const pendingConnections = new Map();

/**
 * GET /api/doctor/gmb/callback
 * OAuth callback - exchanges code for tokens, then shows location selection
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Contains doctorId
    const error = searchParams.get('error');

    const baseUrl = getBaseUrl(request);

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'Authorization failed';
      return redirectWithError(errorDescription, baseUrl);
    }

    if (!code || !state) {
      return redirectWithError('Invalid callback parameters', baseUrl);
    }

    // Verify doctor exists
    await connectDB();
    const doctor = await Doctor.findById(state);
    if (!doctor) {
      return redirectWithError('Invalid session. Please try again.', baseUrl);
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.refreshToken) {
      return redirectWithError('Failed to get refresh token. Please try again.', baseUrl);
    }

    // Get GMB accounts
    const accounts = await getAccounts(tokens.accessToken);

    if (!accounts || accounts.length === 0) {
      return redirectWithError('No Google My Business accounts found. Please ensure you have access to a GMB account.', baseUrl);
    }

    // Get all locations from all accounts
    const allLocations = [];
    for (const account of accounts) {
      try {
        const locations = await getLocations(tokens.accessToken, account.name);
        if (locations && locations.length > 0) {
          locations.forEach(loc => {
            allLocations.push({
              accountId: account.name,
              accountName: account.accountName || account.name,
              locationId: loc.name,
              locationName: loc.title || loc.name,
              locationAddress: formatAddress(loc.storefrontAddress),
              businessName: loc.title,
              businessPhone: loc.phoneNumbers?.primaryPhone,
              businessWebsite: loc.websiteUri,
              businessCategory: loc.categories?.primaryCategory?.displayName,
              placeId: loc.metadata?.placeId,
            });
          });
        }
      } catch (locError) {
        console.error(`[GMB Callback] Failed to get locations for ${account.name}:`, locError);
      }
    }

    if (allLocations.length === 0) {
      return redirectWithError('No business locations found in your GMB account.', baseUrl);
    }

    // If only one location, connect directly
    if (allLocations.length === 1) {
      await createConnection(doctor, tokens, allLocations[0]);
      return NextResponse.redirect(
        new URL(`/admin/dashboard/gmb?connected=true&business=${encodeURIComponent(allLocations[0].businessName)}`, baseUrl)
      );
    }

    // Multiple locations - store tokens temporarily and redirect to selection page
    const pendingId = `pending_${doctor._id}_${Date.now()}`;
    pendingConnections.set(pendingId, {
      doctorId: doctor._id.toString(),
      tokens,
      locations: allLocations,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Clean up expired pending connections
    cleanupPendingConnections();

    return NextResponse.redirect(
      new URL(`/admin/dashboard/gmb/select-locations?pending=${pendingId}`, baseUrl)
    );

  } catch (error) {
    console.error('[GMB Callback] Error:', error);
    return redirectWithError(error.message || 'Failed to connect GMB account', getBaseUrl(request));
  }
}

/**
 * Create GMB connection for a location
 */
async function createConnection(doctor, tokens, location) {
  const connectionData = {
    doctorId: doctor._id,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
    accountId: location.accountId,
    accountName: location.accountName,
    locationId: location.locationId,
    locationName: location.locationName,
    locationAddress: location.locationAddress,
    businessName: location.businessName,
    businessPhone: location.businessPhone,
    businessWebsite: location.businessWebsite,
    businessCategory: location.businessCategory,
    placeId: location.placeId,
    status: 'active',
    lastSyncAt: new Date(),
    lastError: null,
  };

  // Upsert connection
  const existingConnection = await GmbConnection.findOne({
    doctorId: doctor._id,
    locationId: location.locationId,
  });

  if (existingConnection) {
    Object.assign(existingConnection, connectionData);
    await existingConnection.save();
  } else {
    await GmbConnection.create(connectionData);

    // Create default review request templates for new doctor
    const hasTemplates = await ReviewRequestTemplate.findOne({ doctorId: doctor._id });
    if (!hasTemplates) {
      try {
        await ReviewRequestTemplate.createDefaultsForDoctor(doctor._id, doctor.name);
      } catch (templateError) {
        console.error('[GMB Callback] Failed to create templates:', templateError);
      }
    }
  }
}

/**
 * Clean up expired pending connections
 */
function cleanupPendingConnections() {
  const now = Date.now();
  for (const [key, value] of pendingConnections.entries()) {
    if (value.expiresAt < now) {
      pendingConnections.delete(key);
    }
  }
}

/**
 * Export for use in location selection API
 */
export { pendingConnections, createConnection };

/**
 * Format address object to string
 */
function formatAddress(address) {
  if (!address) return null;

  const parts = [];
  if (address.addressLines) {
    parts.push(...address.addressLines);
  }
  if (address.locality) parts.push(address.locality);
  if (address.administrativeArea) parts.push(address.administrativeArea);
  if (address.postalCode) parts.push(address.postalCode);

  return parts.join(', ');
}

/**
 * Redirect with error message
 */
function redirectWithError(message, baseUrl) {
  return NextResponse.redirect(
    new URL(`/admin/dashboard/gmb?error=${encodeURIComponent(message)}`, baseUrl)
  );
}

/**
 * Get base URL - use request origin for localhost, otherwise use APP_URL
 */
function getBaseUrl(request) {
  if (request) {
    const url = new URL(request.url);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return url.origin;
    }
  }
  return process.env.NEXT_PUBLIC_APP_URL;
}
