import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';
import ContactStatus from '@/models/ContactStatus';
import { requireDoctorAuth } from '@/lib/doctorAuth';

export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const skip = (page - 1) * limit;

    const query = { doctorId: doctor._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const [contacts, total, statusCounts] = await Promise.all([
      Contact.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Contact.countDocuments(query),
      Contact.aggregate([
        { $match: { doctorId: doctor._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const statusCountMap = {};
    statusCounts.forEach(s => { statusCountMap[s._id] = s.count; });

    return NextResponse.json({
      success: true,
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      statusCounts: statusCountMap,
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Contacts GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const body = await request.json();
    const { name, phone, email, status, tags, notes, googleReviewLink } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Contact name is required' }, { status: 400 });
    }

    // Ensure statuses exist for this doctor
    const statusCount = await ContactStatus.countDocuments({ doctorId: doctor._id });
    if (statusCount === 0) {
      await ContactStatus.createDefaultsForDoctor(doctor._id);
    }

    const contact = await Contact.create({
      doctorId: doctor._id,
      name: name.trim(),
      phone: phone?.trim() || undefined,
      email: email?.trim().toLowerCase() || undefined,
      status: status || 'new',
      tags: tags || [],
      source: 'manual',
      notes: notes || undefined,
      googleReviewLink: googleReviewLink?.trim() || undefined,
    });

    return NextResponse.json({ success: true, contact }, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Contacts POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to create contact' }, { status: 500 });
  }
}
