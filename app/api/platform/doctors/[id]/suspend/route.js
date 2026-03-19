import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';

// POST - Toggle doctor suspension status
export async function POST(request, { params }) {
  try {
    const { authenticated, admin } = await requirePlatformAdmin();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    await connectDB();

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Toggle status
    const newStatus = !doctor.isActive;

    doctor.isActive = newStatus;

    if (!newStatus) {
      // Suspending
      doctor.suspendedAt = new Date();
      doctor.suspendedReason = reason || 'Suspended by platform admin';
    } else {
      // Activating
      doctor.suspendedAt = null;
      doctor.suspendedReason = null;
    }

    await doctor.save();

    return NextResponse.json({
      success: true,
      message: newStatus ? 'Doctor account activated' : 'Doctor account suspended',
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        isActive: doctor.isActive,
        suspendedAt: doctor.suspendedAt,
        suspendedReason: doctor.suspendedReason
      }
    });

  } catch (error) {
    console.error('Suspend doctor error:', error);
    return NextResponse.json(
      { error: 'Failed to update doctor status' },
      { status: 500 }
    );
  }
}
