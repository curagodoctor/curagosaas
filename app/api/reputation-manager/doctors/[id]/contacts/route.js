import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ReputationManager from '@/models/ReputationManager';
import Contact from '@/models/Contact';
import ContactStatus from '@/models/ContactStatus';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getManagerAndVerifyDoctor(doctorId) {
  const cookieStore = await cookies();
  const token = cookieStore.get('rep_manager_token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.SESSION_SECRET);
    if (decoded.role !== 'reputation_manager') return null;
    const manager = await ReputationManager.findById(decoded.managerId);
    if (!manager || !manager.isActive) return null;

    // Verify doctor is assigned to this manager
    if (!manager.assignedDoctors.some(d => d.toString() === doctorId)) return null;
    return manager;
  } catch {
    return null;
  }
}

export async function GET(request, { params }) {
  try {
    const { id: doctorId } = await params;
    const manager = await getManagerAndVerifyDoctor(doctorId);
    if (!manager) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const query = { doctorId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;

    const [contacts, total, statuses] = await Promise.all([
      Contact.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Contact.countDocuments(query),
      ContactStatus.find({ doctorId, isActive: true }).sort({ sortOrder: 1 }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      contacts,
      statuses,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[RepManager Contacts GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

// POST - Add contact (no delete allowed)
export async function POST(request, { params }) {
  try {
    const { id: doctorId } = await params;
    const manager = await getManagerAndVerifyDoctor(doctorId);
    if (!manager) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { name, phone, email, status, notes } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    // Ensure statuses exist
    const statusCount = await ContactStatus.countDocuments({ doctorId });
    if (statusCount === 0) {
      await ContactStatus.createDefaultsForDoctor(doctorId);
    }

    const contact = await Contact.create({
      doctorId,
      name,
      phone: phone || undefined,
      email: email?.toLowerCase() || undefined,
      status: status || 'new',
      notes: notes || undefined,
      source: 'manual',
    });

    return NextResponse.json({ success: true, contact }, { status: 201 });
  } catch (error) {
    console.error('[RepManager Contacts POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to add contact' }, { status: 500 });
  }
}
