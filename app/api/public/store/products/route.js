import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getPublishedCards } from '@/lib/store/products';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET — published store products as public cards (for the /store page).
export async function GET() {
  try {
    await connectDB();
    const products = await getPublishedCards();
    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('[public store products]', error);
    return NextResponse.json({ success: false, error: 'Could not load the store.' }, { status: 500 });
  }
}
