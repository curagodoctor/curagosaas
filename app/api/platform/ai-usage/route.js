import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import connectDB from '@/lib/mongodb';
import { getGlobalAiUsage } from '@/lib/practice-os/aiUsage';

export const runtime = 'nodejs';

// Platform-wide AI usage for the admin "AI Usage" dashboard.
export async function GET(request) {
  const { authenticated } = await requirePlatformAdmin();
  if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const days = Math.min(90, Math.max(7, parseInt(new URL(request.url).searchParams.get('days') || '30', 10) || 30));
  const usage = await getGlobalAiUsage({ days });
  return NextResponse.json({ success: true, usage });
}
