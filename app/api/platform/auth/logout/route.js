import { NextResponse } from 'next/server';
import { clearAdminCookie } from '@/lib/platformAdminAuth';

export async function POST() {
  try {
    await clearAdminCookie();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Platform admin logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed', details: error.message },
      { status: 500 }
    );
  }
}
