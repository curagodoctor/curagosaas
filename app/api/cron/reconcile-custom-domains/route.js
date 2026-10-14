import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { reconcileAllDomains } from '@/lib/reconcileDomains';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Daily: auto-verify custom domains that are live on Vercel but whose flag never
// got flipped (doctor set DNS but didn't re-click "Verify"). Keeps canonical / OG
// / schema URLs pointed at the real custom domain. Upgrade-only (never downgrades).
export async function GET(request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const force = new URL(request.url).searchParams.get('force') === '1';
    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !force) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const result = await reconcileAllDomains();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[reconcile-custom-domains]', error);
    return NextResponse.json({ success: false, error: 'Reconcile failed' }, { status: 500 });
  }
}
