import { Storage } from '@google-cloud/storage';

/**
 * Google Cloud Storage — used for Practice OS lecture video hosting.
 *
 * Reuses the same service-account credentials as the Calendar integration
 * (GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY[_BASE64]). Uploads use v4
 * signed URLs so large video files go browser → GCS directly, bypassing the
 * serverless request-body size limit.
 *
 * Required env: GCS_BUCKET (a bucket configured for public object reads and CORS
 * that allows PUT from the app origin). Optional: GCS_PROJECT_ID.
 */

function getPrivateKey() {
  if (process.env.GOOGLE_PRIVATE_KEY_BASE64) {
    return Buffer.from(process.env.GOOGLE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
  }
  if (process.env.GOOGLE_PRIVATE_KEY) {
    return process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').trim();
  }
  return null;
}

export function isGcsConfigured() {
  return !!(process.env.GCS_BUCKET && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && getPrivateKey());
}

let _storage;
function storage() {
  if (_storage) return _storage;
  _storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID || undefined,
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: getPrivateKey(),
    },
  });
  return _storage;
}

// We reference stored objects as `gs://<bucket>/<objectPath>` rather than a
// public https URL, because the bucket is private (org policy forbids public
// buckets). Playback URLs are minted on demand as short-lived signed read URLs.
const GS_PREFIX = 'gs://';

export function toGsUri(objectPath) {
  return `${GS_PREFIX}${process.env.GCS_BUCKET}/${objectPath}`;
}

export function isGsUri(value) {
  return typeof value === 'string' && value.startsWith(GS_PREFIX);
}

export function parseGsUri(uri) {
  const rest = uri.slice(GS_PREFIX.length);
  const slash = rest.indexOf('/');
  if (slash === -1) return { bucket: rest, objectPath: '' };
  return { bucket: rest.slice(0, slash), objectPath: rest.slice(slash + 1) };
}

/**
 * Create a v4 signed URL the browser can PUT a file to.
 * @returns {Promise<{ uploadUrl: string, gsUri: string, objectPath: string }>}
 */
export async function getSignedUploadUrl({ objectPath, contentType, expiresMs = 15 * 60 * 1000 }) {
  const [uploadUrl] = await storage()
    .bucket(process.env.GCS_BUCKET)
    .file(objectPath)
    .getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + expiresMs,
      contentType,
    });
  return { uploadUrl, gsUri: toGsUri(objectPath), objectPath };
}

/**
 * Mint a short-lived signed READ URL for a stored object. Accepts a `gs://…`
 * URI or a bare object path. Returns null if GCS isn't configured.
 * @returns {Promise<string|null>}
 */
export async function getSignedReadUrl(ref, { expiresMs = 12 * 60 * 60 * 1000 } = {}) {
  if (!ref || !isGcsConfigured()) return null;
  let bucket = process.env.GCS_BUCKET;
  let objectPath = ref;
  if (isGsUri(ref)) ({ bucket, objectPath } = parseGsUri(ref));
  if (!objectPath) return null;
  const [url] = await storage()
    .bucket(bucket)
    .file(objectPath)
    .getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + expiresMs });
  return url;
}

/**
 * If `url` is a `gs://` reference, return a signed read URL; otherwise return it
 * unchanged (e.g. a YouTube link or empty string). Never throws.
 * @returns {Promise<string>}
 */
export async function resolvePlayableUrl(url) {
  if (!isGsUri(url)) return url || '';
  try {
    return (await getSignedReadUrl(url)) || '';
  } catch (e) {
    console.error('[GCS] resolvePlayableUrl failed:', e.message);
    return '';
  }
}
