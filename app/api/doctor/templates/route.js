import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import MessageTemplate from '@/models/MessageTemplate';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { requireFeatureOr403, FEATURES } from '@/lib/entitlements';

export async function GET(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const locked = await requireFeatureOr403(doctor._id, FEATURES.TEMPLATES);
    if (locked) return locked;

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');

    const query = { doctorId: doctor._id };
    if (channel) query.channel = channel;

    let templates = await MessageTemplate.find(query).sort({ channel: 1, name: 1 }).lean();

    // Auto-seed defaults if none exist
    if (templates.length === 0) {
      await MessageTemplate.createDefaultsForDoctor(doctor._id);
      templates = await MessageTemplate.find(query).sort({ channel: 1, name: 1 }).lean();
    }

    return NextResponse.json({ success: true, templates });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Templates GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const locked = await requireFeatureOr403(doctor._id, FEATURES.TEMPLATES);
    if (locked) return locked;

    const { name, channel, subject, body } = await request.json();

    if (!name || !channel || !body) {
      return NextResponse.json({ success: false, error: 'Name, channel, and body are required' }, { status: 400 });
    }

    if (!['sms', 'email'].includes(channel)) {
      return NextResponse.json({ success: false, error: 'Channel must be sms or email' }, { status: 400 });
    }

    if (channel === 'email' && !subject) {
      return NextResponse.json({ success: false, error: 'Subject is required for email templates' }, { status: 400 });
    }

    const template = await MessageTemplate.create({
      doctorId: doctor._id,
      name,
      channel,
      subject: subject || undefined,
      body,
    });

    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Templates POST]', error);
    return NextResponse.json({ success: false, error: 'Failed to create template' }, { status: 500 });
  }
}
