import { NextResponse } from 'next/server';
import { getAdminFromCookie } from '@/lib/platformAdminAuth';

export async function GET() {
  try {
    const admin = await getAdminFromCookie();

    if (!admin) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      admin: {
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Platform admin me error:', error);
    return NextResponse.json(
      { error: 'Failed to get admin info', details: error.message },
      { status: 500 }
    );
  }
}
