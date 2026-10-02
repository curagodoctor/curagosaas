import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Doctor from '@/models/Doctor';

// GET — PER-DOCTOR booking activity ONLY. Patient details (name, phone, email,
// notes) are NEVER returned to the platform admin: they belong to the doctor and
// are visible only on the doctor's own dashboard. CuraGo tracks how many bookings
// each doctor is getting (a business metric) — not WHO the patients are.
export async function GET(request) {
  try {
    const { authenticated } = await requirePlatformAdmin();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    await connectDB();

    const match = {};
    if (status) match.status = status;
    if (dateFrom || dateTo) {
      match.date = {};
      if (dateFrom) match.date.$gte = dateFrom;
      if (dateTo) match.date.$lte = dateTo;
    }

    // Aggregate per doctor — counts only, no patient fields ever read out.
    const [byDoctor, statusAgg, total] = await Promise.all([
      Booking.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$doctorId',
            total: { $sum: 1 },
            confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
            lastBookingAt: { $max: '$createdAt' },
          },
        },
        { $sort: { total: -1 } },
      ]),
      Booking.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Booking.countDocuments(match),
    ]);

    // Resolve doctor display info for only the doctors who HAVE bookings.
    const ids = byDoctor.map((d) => d._id).filter(Boolean);
    const docs = await Doctor.find({ _id: { $in: ids } }).select('name displayName subdomain').lean();
    const map = Object.fromEntries(docs.map((d) => [String(d._id), d]));

    const doctors = byDoctor
      .filter((d) => d._id)
      .map((d) => ({
        doctorId: String(d._id),
        doctorName: map[String(d._id)]?.displayName || map[String(d._id)]?.name || 'Unknown',
        doctorSubdomain: map[String(d._id)]?.subdomain || '',
        total: d.total,
        confirmed: d.confirmed,
        lastBookingAt: d.lastBookingAt,
      }));

    return NextResponse.json({
      // Doctors with booking activity (no patient data).
      doctors,
      stats: {
        total,
        activeDoctors: doctors.length,
        byStatus: statusAgg.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
      },
      filters: { statuses: ['pending_payment', 'confirmed', 'expired', 'cancelled'] },
    });
  } catch (error) {
    console.error('Get bookings (per-doctor) error:', error);
    return NextResponse.json({ error: 'Failed to fetch booking activity' }, { status: 500 });
  }
}
