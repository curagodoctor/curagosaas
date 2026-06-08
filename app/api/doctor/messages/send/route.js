import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';
import MessageTemplate from '@/models/MessageTemplate';
import MessageQuota from '@/models/MessageQuota';
import Clinic from '@/models/Clinic';
import Subscription from '@/models/Subscription';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { sendBulkMessages } from '@/lib/messaging';

export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    // Check subscription is active
    const isSubscribed = await Subscription.isActive(doctor._id);
    if (!isSubscribed) {
      return NextResponse.json({
        success: false,
        error: 'SUBSCRIPTION_EXPIRED',
        message: 'Your trial has expired. Please subscribe to continue sending messages.',
      }, { status: 403 });
    }

    const { contactIds, templateId, channel } = await request.json();

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ success: false, error: 'contactIds array is required' }, { status: 400 });
    }

    if (!templateId) {
      return NextResponse.json({ success: false, error: 'templateId is required' }, { status: 400 });
    }

    if (!['sms', 'email'].includes(channel)) {
      return NextResponse.json({ success: false, error: 'Channel must be sms or email' }, { status: 400 });
    }

    // Fetch template
    const template = await MessageTemplate.findOne({ _id: templateId, doctorId: doctor._id, isActive: true });
    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found or inactive' }, { status: 404 });
    }

    // Fetch contacts
    const contacts = await Contact.find({ _id: { $in: contactIds }, doctorId: doctor._id }).lean();
    if (contacts.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid contacts found' }, { status: 400 });
    }

    // Check quota upfront
    const quota = await MessageQuota.checkQuota(doctor._id, channel);
    if (!quota.allowed) {
      return NextResponse.json({
        success: false,
        error: 'Monthly message quota exceeded',
        remaining: quota.remaining,
        limit: quota.limit,
      }, { status: 429 });
    }

    if (quota.remaining < contacts.length) {
      return NextResponse.json({
        success: false,
        error: `Insufficient quota. ${quota.remaining} messages remaining, ${contacts.length} requested.`,
        remaining: quota.remaining,
      }, { status: 429 });
    }

    // Get clinic name for template variables
    const clinic = await Clinic.findOne({ doctorId: doctor._id, isActive: true }).sort({ isPrimary: -1 }).lean();

    const doctorData = {
      _id: doctor._id,
      name: doctor.name,
      displayName: doctor.displayName,
      clinicName: clinic?.name || doctor.displayName || doctor.name,
    };

    // Send messages
    const results = await sendBulkMessages({
      contacts,
      template,
      channel,
      doctor: doctorData,
    });

    return NextResponse.json({
      success: true,
      sent: results.sent,
      failed: results.failed,
      total: contacts.length,
      errors: results.errors.slice(0, 10),
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Messages Send]', error);
    return NextResponse.json({ success: false, error: 'Failed to send messages' }, { status: 500 });
  }
}
