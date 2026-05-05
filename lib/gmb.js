/**
 * Google My Business API Library
 * Handles OAuth 2.0 flow and API interactions
 */

import GmbConnection from '@/models/GmbConnection';
import connectDB from '@/lib/mongodb';

// GMB API Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_GMB_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_GMB_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_GMB_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/doctor/gmb/callback`;

// OAuth Scopes for GMB
const GMB_SCOPES = [
  'https://www.googleapis.com/auth/business.manage', // Manage GMB listings
  'https://www.googleapis.com/auth/plus.business.manage', // Legacy scope
];

// API Base URLs
const GMB_API_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1';
const GMB_ACCOUNTS_API = 'https://mybusinessaccountmanagement.googleapis.com/v1';
const GMB_REVIEWS_API = 'https://mybusiness.googleapis.com/v4';
const GMB_QA_API = 'https://mybusinessqanda.googleapis.com/v1';

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(doctorId, state = null) {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: GMB_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent', // Force consent to get refresh token
    state: state || doctorId, // Use doctorId as state for verification
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: GOOGLE_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to exchange code for tokens');
  }

  const tokens = await response.json();
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in, // seconds
    tokenType: tokens.token_type,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to refresh token');
  }

  const tokens = await response.json();
  return {
    accessToken: tokens.access_token,
    expiresIn: tokens.expires_in,
  };
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidAccessToken(gmbConnectionId) {
  await connectDB();
  const connection = await GmbConnection.findById(gmbConnectionId)
    .select('+accessToken +refreshToken');

  if (!connection) {
    throw new Error('GMB connection not found');
  }

  // Check if token needs refresh
  if (connection.needsTokenRefresh()) {
    try {
      const { accessToken, expiresIn } = await refreshAccessToken(connection.refreshToken);

      // Update connection with new token
      connection.accessToken = accessToken;
      connection.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
      connection.status = 'active';
      connection.lastError = null;
      await connection.save();

      return accessToken;
    } catch (error) {
      // Mark connection as expired/error
      connection.status = 'expired';
      connection.lastError = error.message;
      await connection.save();
      throw new Error('Failed to refresh GMB token. Please reconnect.');
    }
  }

  return connection.accessToken;
}

/**
 * Make authenticated GMB API request
 */
async function gmbApiRequest(gmbConnectionId, endpoint, options = {}) {
  const accessToken = await getValidAccessToken(gmbConnectionId);

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `GMB API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get GMB accounts list
 */
export async function getAccounts(accessToken) {
  const response = await fetch(`${GMB_ACCOUNTS_API}/accounts`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to fetch GMB accounts');
  }

  const data = await response.json();
  return data.accounts || [];
}

/**
 * Get locations for an account
 */
export async function getLocations(accessToken, accountId) {
  const response = await fetch(`${GMB_API_BASE}/${accountId}/locations?readMask=name,title,storefrontAddress,websiteUri,phoneNumbers,categories`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to fetch locations');
  }

  const data = await response.json();
  return data.locations || [];
}

// ============= POST MANAGEMENT =============

/**
 * Create a GMB post
 */
export async function createPost(gmbConnectionId, locationId, postData) {
  const endpoint = `${GMB_API_BASE}/${locationId}/localPosts`;

  const body = {
    languageCode: 'en',
    summary: postData.content,
    topicType: postData.postType || 'STANDARD',
  };

  // Add media if provided
  if (postData.mediaUrl) {
    body.media = [{
      mediaFormat: postData.mediaType === 'video' ? 'VIDEO' : 'PHOTO',
      sourceUrl: postData.mediaUrl,
    }];
  }

  // Add CTA if provided
  if (postData.ctaType && postData.ctaType !== 'NONE') {
    body.callToAction = {
      actionType: postData.ctaType,
      url: postData.ctaUrl,
    };
  }

  // Add event details if EVENT type
  if (postData.postType === 'EVENT') {
    body.event = {
      title: postData.eventTitle,
      schedule: {
        startDate: formatGoogleDate(postData.eventStartDate),
        endDate: formatGoogleDate(postData.eventEndDate),
      },
    };
  }

  // Add offer details if OFFER type
  if (postData.postType === 'OFFER') {
    body.offer = {
      couponCode: postData.couponCode,
      redeemOnlineUrl: postData.redeemUrl,
      termsConditions: postData.offerTerms,
    };
  }

  return gmbApiRequest(gmbConnectionId, endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Delete a GMB post
 */
export async function deletePost(gmbConnectionId, postName) {
  return gmbApiRequest(gmbConnectionId, `${GMB_API_BASE}/${postName}`, {
    method: 'DELETE',
  });
}

// ============= REVIEW MANAGEMENT =============

/**
 * Get reviews for a location
 */
export async function getReviews(gmbConnectionId, accountName, locationName, pageToken = null) {
  let endpoint = `${GMB_REVIEWS_API}/${accountName}/${locationName}/reviews`;
  if (pageToken) {
    endpoint += `?pageToken=${pageToken}`;
  }

  return gmbApiRequest(gmbConnectionId, endpoint);
}

/**
 * Reply to a review
 */
export async function replyToReview(gmbConnectionId, reviewName, replyText) {
  const endpoint = `${GMB_REVIEWS_API}/${reviewName}/reply`;

  return gmbApiRequest(gmbConnectionId, endpoint, {
    method: 'PUT',
    body: JSON.stringify({ comment: replyText }),
  });
}

/**
 * Delete a review reply
 */
export async function deleteReviewReply(gmbConnectionId, reviewName) {
  const endpoint = `${GMB_REVIEWS_API}/${reviewName}/reply`;

  return gmbApiRequest(gmbConnectionId, endpoint, {
    method: 'DELETE',
  });
}

// ============= Q&A MANAGEMENT =============

/**
 * Get questions for a location
 */
export async function getQuestions(gmbConnectionId, locationName, pageToken = null) {
  let endpoint = `${GMB_QA_API}/${locationName}/questions`;
  if (pageToken) {
    endpoint += `?pageToken=${pageToken}`;
  }

  return gmbApiRequest(gmbConnectionId, endpoint);
}

/**
 * Answer a question
 */
export async function answerQuestion(gmbConnectionId, questionName, answerText) {
  const endpoint = `${GMB_QA_API}/${questionName}/answers`;

  return gmbApiRequest(gmbConnectionId, endpoint, {
    method: 'POST',
    body: JSON.stringify({ text: answerText }),
  });
}

/**
 * Update an answer
 */
export async function updateAnswer(gmbConnectionId, answerName, answerText) {
  const endpoint = `${GMB_QA_API}/${answerName}`;

  return gmbApiRequest(gmbConnectionId, endpoint, {
    method: 'PATCH',
    body: JSON.stringify({ text: answerText }),
  });
}

// ============= INSIGHTS =============

/**
 * Get insights for a location
 */
export async function getInsights(gmbConnectionId, locationName, startDate, endDate) {
  const endpoint = `${GMB_API_BASE}/${locationName}:fetchMultiDailyMetricsTimeSeries`;

  const body = {
    dailyMetrics: [
      'QUERIES_DIRECT',
      'QUERIES_INDIRECT',
      'VIEWS_MAPS',
      'VIEWS_SEARCH',
      'ACTIONS_WEBSITE',
      'ACTIONS_PHONE',
      'ACTIONS_DRIVING_DIRECTIONS',
    ],
    dailyRange: {
      startDate: formatGoogleDate(startDate),
      endDate: formatGoogleDate(endDate),
    },
  };

  return gmbApiRequest(gmbConnectionId, endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Get search keywords (Business Profile Performance)
 */
export async function getSearchKeywords(gmbConnectionId, locationName, startDate, endDate) {
  const endpoint = `${GMB_API_BASE}/${locationName}:searchkeywords:impressions:monthly?monthlyRange.startMonth.year=${startDate.getFullYear()}&monthlyRange.startMonth.month=${startDate.getMonth() + 1}&monthlyRange.endMonth.year=${endDate.getFullYear()}&monthlyRange.endMonth.month=${endDate.getMonth() + 1}`;

  return gmbApiRequest(gmbConnectionId, endpoint);
}

// ============= HELPERS =============

/**
 * Format date for Google API
 */
function formatGoogleDate(date) {
  const d = new Date(date);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  };
}

/**
 * Build GMB review link for a location
 */
export function buildReviewLink(placeId) {
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
}

/**
 * Check if GMB credentials are configured
 */
export function isGmbConfigured() {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

/**
 * Get GMB connection status for a doctor
 */
export async function getConnectionStatus(doctorId) {
  await connectDB();
  const connection = await GmbConnection.findActiveByDoctor(doctorId);

  if (!connection) {
    return { connected: false };
  }

  return {
    connected: true,
    status: connection.status,
    businessName: connection.businessName,
    locationName: connection.locationName,
    lastSyncAt: connection.lastSyncAt,
    features: connection.features,
  };
}
