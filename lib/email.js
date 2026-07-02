import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'Curago <noreply@curago.in>';

/**
 * Send email verification OTP
 */
export async function sendVerificationEmail(email, otp, name) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Verify your Curago account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #10b981; margin: 0; font-size: 28px;">Curago</h1>
                <p style="color: #666; margin-top: 5px;">Healthcare Simplified</p>
              </div>

              <h2 style="color: #333; margin-bottom: 20px;">Welcome, ${name}!</h2>

              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                Thank you for signing up. Please use the following verification code to complete your registration:
              </p>

              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
                <span style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px;">${otp}</span>
              </div>

              <p style="color: #888; font-size: 14px; text-align: center;">
                This code expires in <strong>10 minutes</strong>
              </p>

              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

              <p style="color: #999; font-size: 12px; text-align: center;">
                If you didn't request this, please ignore this email.<br>
                © ${new Date().getFullYear()} Curago. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(email, name, subdomain) {
  try {
    const siteUrl = `https://${subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'curago.in'}`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to Curago! Your clinic is live 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #10b981; margin: 0; font-size: 28px;">🎉 You're all set!</h1>
              </div>

              <h2 style="color: #333; margin-bottom: 20px;">Welcome to Curago, ${name}!</h2>

              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                Your clinic website is now live and ready for patients:
              </p>

              <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                <a href="${siteUrl}" style="color: #10b981; font-size: 20px; font-weight: bold; text-decoration: none;">
                  ${siteUrl}
                </a>
              </div>

              <h3 style="color: #333; margin-top: 30px;">Next Steps:</h3>
              <ul style="color: #555; font-size: 15px; line-height: 1.8;">
                <li>Customize your website in the dashboard</li>
                <li>Set up your consultation slots</li>
                <li>Add your clinic locations</li>
                <li>Configure your WhatsApp number for bookings</li>
              </ul>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://curago.in'}/admin/dashboard"
                   style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  Go to Dashboard
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

              <p style="color: #999; font-size: 12px; text-align: center;">
                Need help? Reply to this email or contact support@curago.in<br>
                © ${new Date().getFullYear()} Curago. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email, resetToken) {
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://curago.in'}/reset-password?token=${resetToken}`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset your Curago password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>

              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                Click the button below to reset your password. This link expires in 1 hour.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}"
                   style="display: inline-block; background: #10b981; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  Reset Password
                </a>
              </div>

              <p style="color: #888; font-size: 14px;">
                If you didn't request this, please ignore this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send booking confirmation email to patient
 */
export async function sendBookingConfirmationToPatient({ email, patientName, doctorName, date, time, mode, meetLink, calendarEventUrl }) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Booking Confirmed - ${date} at ${time} with ${doctorName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #10b981; margin: 0; font-size: 28px;">Curago</h1>
              </div>

              <div style="text-align: center; margin-bottom: 25px;">
                <div style="width: 60px; height: 60px; background: #d1fae5; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 30px;">&#10003;</span>
                </div>
                <h2 style="color: #065f46; margin: 0;">Booking Confirmed!</h2>
              </div>

              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                Hi ${patientName}, your appointment has been successfully booked.
              </p>

              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Doctor</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${doctorName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Time</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${time}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Mode</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${mode}</td>
                  </tr>
                </table>
              </div>

              ${meetLink ? `
              <div style="text-align: center; margin: 25px 0;">
                <a href="${meetLink}"
                   style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  Join Google Meet
                </a>
              </div>
              ` : ''}

              ${calendarEventUrl ? `
              <p style="text-align: center;">
                <a href="${calendarEventUrl}" style="color: #10b981; font-size: 14px;">View in Google Calendar</a>
              </p>
              ` : ''}

              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

              <p style="color: #999; font-size: 12px; text-align: center;">
                Need to reschedule? Contact the clinic via WhatsApp at least 2 hours before your slot.<br>
                &copy; ${new Date().getFullYear()} Curago. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error (patient confirmation):', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send error (patient confirmation):', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send booking notification email to doctor
 */
export async function sendBookingNotificationToDoctor({ email, doctorName, patientName, patientPhone, patientEmail, date, time, mode, calendarEventUrl }) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `New Booking: ${patientName} - ${date} at ${time}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #10b981; margin: 0; font-size: 28px;">Curago</h1>
              </div>

              <h2 style="color: #333; margin-bottom: 10px;">New Appointment Booked</h2>
              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                Hi ${doctorName}, a new appointment has been booked.
              </p>

              <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px; color: #1e40af; font-size: 16px;">Patient Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Name</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${patientName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Phone</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">+91${patientPhone}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${patientEmail}</td>
                  </tr>
                </table>
              </div>

              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px; color: #065f46; font-size: 16px;">Appointment Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Time</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${time}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Mode</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${mode}</td>
                  </tr>
                </table>
              </div>

              ${calendarEventUrl ? `
              <div style="text-align: center; margin: 25px 0;">
                <a href="${calendarEventUrl}"
                   style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  View in Calendar
                </a>
              </div>
              ` : ''}

              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

              <p style="color: #999; font-size: 12px; text-align: center;">
                &copy; ${new Date().getFullYear()} Curago. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error (doctor notification):', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send error (doctor notification):', error);
    return { success: false, error: error.message };
  }
}

export default resend;
