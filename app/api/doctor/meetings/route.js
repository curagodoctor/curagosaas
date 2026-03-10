import { NextResponse } from 'next/server';
import { getCurrentDoctor } from '@/lib/doctorAuth';
import connectDB from '@/lib/mongodb';
import MeetingLink from '@/models/MeetingLink';

// GET - Get all meeting links for the doctor
export async function GET(request) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const meetingLinks = await MeetingLink.find({ doctorId: doctor._id })
      .sort({ isDefault: -1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      meetingLinks,
    });
  } catch (error) {
    console.error('Get meeting links error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// POST - Create new meeting link
export async function POST(request) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { name, description, url, type } = await request.json();

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      );
    }

    // Check if this is the first meeting link
    const linkCount = await MeetingLink.countDocuments({ doctorId: doctor._id });
    const isDefault = linkCount === 0;

    // Detect type from URL if not provided
    let detectedType = type || 'other';
    if (!type) {
      if (url.includes('zoom.us')) detectedType = 'zoom';
      else if (url.includes('meet.google.com')) detectedType = 'google-meet';
      else if (url.includes('teams.microsoft.com')) detectedType = 'teams';
    }

    const meetingLink = await MeetingLink.create({
      doctorId: doctor._id,
      name,
      description: description || '',
      url,
      type: detectedType,
      isDefault,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      meetingLink,
    });
  } catch (error) {
    console.error('Create meeting link error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// PUT - Update meeting link
export async function PUT(request) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id, name, description, url, type, isDefault, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await MeetingLink.findOne({
      _id: id,
      doctorId: doctor._id,
    });

    if (!existing) {
      return NextResponse.json({ error: 'Meeting link not found' }, { status: 404 });
    }

    // Handle setting as default
    if (isDefault === true) {
      await MeetingLink.updateMany(
        { doctorId: doctor._id, _id: { $ne: id } },
        { isDefault: false }
      );
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (url !== undefined) updateData.url = url;
    if (type !== undefined) updateData.type = type;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isActive !== undefined) updateData.isActive = isActive;

    const meetingLink = await MeetingLink.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    return NextResponse.json({
      success: true,
      meetingLink,
    });
  } catch (error) {
    console.error('Update meeting link error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// DELETE - Delete meeting link
export async function DELETE(request) {
  try {
    const doctor = await getCurrentDoctor(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const result = await MeetingLink.findOneAndDelete({
      _id: id,
      doctorId: doctor._id,
    });

    if (!result) {
      return NextResponse.json({ error: 'Meeting link not found' }, { status: 404 });
    }

    // If deleted link was default, make the first remaining link default
    if (result.isDefault) {
      const firstLink = await MeetingLink.findOne({ doctorId: doctor._id })
        .sort({ createdAt: 1 });
      if (firstLink) {
        firstLink.isDefault = true;
        await firstLink.save();
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete meeting link error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
