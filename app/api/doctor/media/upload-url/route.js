import { NextResponse } from 'next/server';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { isGcsConfigured, getSignedUploadUrl } from '@/lib/gcs';

export const runtime = 'nodejs';

const MAX = 500 * 1024 * 1024; // 500MB

// POST — signed URL so the doctor's browser PUTs a gallery video straight to GCS
// (under site-media/<doctorId>/…). Returns the gs:// ref to store on the section.
export async function POST(request) {
  let doctor;
  try { doctor = await requireDoctorAuth(request); } catch { return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }); }
  if (!isGcsConfigured()) return NextResponse.json({ success: false, error: 'Video storage is not configured.' }, { status: 500 });

  const { filename, contentType, size } = await request.json();
  if (!contentType || !contentType.startsWith('video/')) return NextResponse.json({ success: false, error: 'Only video files are allowed.' }, { status: 400 });
  if (size && size > MAX) return NextResponse.json({ success: false, error: 'Video is too large (max 500MB).' }, { status: 400 });

  const ext = (filename?.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'mp4';
  const rand = Math.random().toString(36).slice(2, 10);
  const objectPath = `site-media/${doctor._id}/${Date.now()}-${rand}.${ext}`;
  const signed = await getSignedUploadUrl({ objectPath, contentType });
  return NextResponse.json({ success: true, ...signed });
}
