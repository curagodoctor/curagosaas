// One-off: set a CORS policy on the Practice OS video bucket so the browser can
// PUT (upload) and GET (play) videos via signed URLs from the app origins.
// Without this, direct-to-GCS uploads fail with a CORS preflight error.
import { readFileSync } from 'fs';
import { Storage } from '@google-cloud/storage';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const get = (k) => (env.match(new RegExp('^' + k + '=(.+)$', 'm')) || [])[1]?.trim().replace(/^["']|["']$/g, '');

const bucket = get('GCS_BUCKET');
const email = get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
const b64 = get('GOOGLE_PRIVATE_KEY_BASE64');
const key = b64 ? Buffer.from(b64, 'base64').toString('utf8') : (get('GOOGLE_PRIVATE_KEY') || '').replace(/\\n/g, '\n');

if (!bucket || !email || !key) { console.error('Missing GCS env in .env.local'); process.exit(1); }

const storage = new Storage({
  projectId: get('GCS_PROJECT_ID') || undefined,
  credentials: { client_email: email, private_key: key },
});

// origin '*' because videos play from arbitrary doctor origins (subdomains +
// custom domains) via short-lived signed URLs — the signature is the auth.
const cors = [{
  origin: ['*'],
  method: ['GET', 'HEAD', 'PUT', 'POST', 'OPTIONS'],
  responseHeader: ['Content-Type', 'x-goog-resumable', 'Content-Length', 'ETag', 'Range'],
  maxAgeSeconds: 3600,
}];

try {
  await storage.bucket(bucket).setCorsConfiguration(cors);
  const [meta] = await storage.bucket(bucket).getMetadata();
  console.log('✅ CORS set on', bucket);
  console.log(JSON.stringify(meta.cors, null, 2));
} catch (e) {
  console.error('❌ Failed:', e.message);
  console.error('The service account may lack storage.buckets.update. Run instead:');
  console.error(`  gsutil cors set cors.json gs://${bucket}`);
  process.exit(1);
}
