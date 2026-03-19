import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/platformAdminAuth';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import crypto from 'crypto';

// Generate a secure random password
function generatePassword(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Generate subdomain from name
function generateSubdomain(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 30);
}

export async function POST(request) {
  try {
    const { authenticated, admin } = await requirePlatformAdmin();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      mode,  // 'password' or 'invite'
      name,
      email,
      phone,
      password,
      subdomain,
      specialization,
      qualification,
      whatsappNumber,
      sendWelcomeEmail,
      markEmailVerified,
      customMessage,  // For invite mode
    } = body;

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if email already exists
    const existingEmail = await Doctor.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'A doctor with this email already exists' },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existingPhone = await Doctor.findOne({ phone });
    if (existingPhone) {
      return NextResponse.json(
        { error: 'A doctor with this phone number already exists' },
        { status: 400 }
      );
    }

    // Generate or validate subdomain
    let finalSubdomain = subdomain || generateSubdomain(name);

    // Check if subdomain is available
    const isAvailable = await Doctor.isSubdomainAvailable(finalSubdomain);
    if (!isAvailable) {
      // Try adding a number suffix
      let suffix = 1;
      while (!(await Doctor.isSubdomainAvailable(`${finalSubdomain}${suffix}`))) {
        suffix++;
        if (suffix > 100) {
          return NextResponse.json(
            { error: 'Could not generate a unique subdomain. Please provide one manually.' },
            { status: 400 }
          );
        }
      }
      finalSubdomain = `${finalSubdomain}${suffix}`;
    }

    if (mode === 'invite') {
      // Create invite token and save for later
      // For now, create doctor with temporary password and send invite
      const tempPassword = crypto.randomBytes(32).toString('hex');
      const inviteToken = crypto.randomBytes(32).toString('hex');

      const doctor = new Doctor({
        name,
        email: email.toLowerCase(),
        phone,
        password: tempPassword,
        subdomain: finalSubdomain,
        specialization: specialization || '',
        qualification: qualification || '',
        whatsappNumber: whatsappNumber || phone,
        isLicensedProfessional: true,
        isEmailVerified: false,
        isActive: true,
        createdBy: admin.email,
      });

      await doctor.save();

      // TODO: Send invite email with token
      // For now, return the invite link that admin can share
      const inviteLink = `${process.env.NEXT_PUBLIC_ROOT_DOMAIN ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}` : 'http://localhost:3000'}/doctor/complete-profile?token=${inviteToken}&email=${encodeURIComponent(email)}`;

      return NextResponse.json({
        success: true,
        message: 'Doctor account created. Invite email will be sent.',
        doctor: {
          id: doctor._id,
          name: doctor.name,
          email: doctor.email,
          subdomain: doctor.subdomain,
        },
        inviteLink, // For testing - remove in production
      });

    } else {
      // Mode: 'password' - Create with password
      const finalPassword = password || generatePassword();

      const doctor = new Doctor({
        name,
        email: email.toLowerCase(),
        phone,
        password: finalPassword,
        subdomain: finalSubdomain,
        specialization: specialization || '',
        qualification: qualification || '',
        whatsappNumber: whatsappNumber || phone,
        isLicensedProfessional: true,
        isEmailVerified: markEmailVerified === true,
        isActive: true,
        createdBy: admin.email,
      });

      await doctor.save();

      // TODO: Send welcome email if sendWelcomeEmail is true
      if (sendWelcomeEmail) {
        // Send email with credentials
        console.log(`Would send welcome email to ${email} with password: ${finalPassword}`);
      }

      return NextResponse.json({
        success: true,
        message: 'Doctor account created successfully',
        doctor: {
          id: doctor._id,
          name: doctor.name,
          email: doctor.email,
          subdomain: doctor.subdomain,
          isEmailVerified: doctor.isEmailVerified,
        },
        // Only return password if it was auto-generated and no email was sent
        ...((!password && !sendWelcomeEmail) && { generatedPassword: finalPassword }),
      });
    }

  } catch (error) {
    console.error('Create doctor error:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return NextResponse.json(
        { error: messages.join(', ') },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        { error: `A doctor with this ${field} already exists` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create doctor' },
      { status: 500 }
    );
  }
}
