// One-off: upload the two cohort onboarding videos to GCS.
// Run: node --env-file=.env.local scripts/upload-cohort-videos.mjs
import { Storage } from '@google-cloud/storage';

function privateKey() {
  if (process.env.GOOGLE_PRIVATE_KEY_BASE64) return Buffer.from(process.env.GOOGLE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
  if (process.env.GOOGLE_PRIVATE_KEY) return process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').trim();
  return null;
}

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID || undefined,
  credentials: { client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, private_key: privateKey() },
});
const bucket = storage.bucket(process.env.GCS_BUCKET);

const FILES = [
  { local: '/Users/raghavendra/Downloads/lv_0_20260812173750.mp4', dest: 'cohort/intro.mp4' },
  { local: '/Users/raghavendra/Downloads/lv_0_20260814183118.mp4', dest: 'cohort/demo.mp4' },
];

for (const f of FILES) {
  process.stdout.write(`Uploading ${f.local} → gs://${process.env.GCS_BUCKET}/${f.dest} … `);
  await bucket.upload(f.local, {
    destination: f.dest,
    resumable: true,
    metadata: { contentType: 'video/mp4', cacheControl: 'public, max-age=86400' },
  });
  console.log('done');
}
console.log('\nAll uploaded. Object paths: cohort/intro.mp4, cohort/demo.mp4');
