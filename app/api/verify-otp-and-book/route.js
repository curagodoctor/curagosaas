import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import OTP from "@/models/OTP";
import Booking from "@/models/Booking";
import Doctor from "@/models/Doctor";
import ConsultationMode from "@/models/ConsultationMode";
import { isSlotBooked } from "@/lib/slotManagerDB";
import { createCalendarEvent } from "@/lib/googleCalendar";
import { validatePhone } from "@/lib/validation";
import { sendBookingConfirmationToPatient, sendBookingNotificationToDoctor } from "@/lib/email";
import { sendSMS } from "@/lib/twilio";

export async function POST(request) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Phone and OTP are required" },
        { status: 400 }
      );
    }

    // Validate phone format
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      return NextResponse.json({ error: phoneValidation.error }, { status: 400 });
    }
    const cleanPhone = phoneValidation.cleanPhone;

    // Validate OTP format (should be 6 digits)
    const cleanOtp = otp.toString().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      return NextResponse.json(
        { error: "OTP must be 6 digits" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify OTP
    const result = await OTP.verifyOTP(cleanPhone, cleanOtp);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    const bookingData = result.bookingData;

    // Get doctorId from bookingData (set during send-otp from subdomain)
    let doctorId = bookingData.doctorId || null;

    // Fallback: if the doctorId wasn't captured during OTP creation, derive it
    // from the selected consultation mode. Without this the booking is saved
    // with no doctorId and the doctor's name is blank in the confirmation
    // SMS/email/webhook.
    if (!doctorId && bookingData.modeId) {
      try {
        const mode = await ConsultationMode.findById(bookingData.modeId).select('doctorId');
        if (mode?.doctorId) doctorId = mode.doctorId.toString();
      } catch (modeErr) {
        console.error('Failed to resolve doctorId from modeId:', modeErr.message);
      }
    }

    // Fetch doctor info (for webhook routing + doctor notification below)
    let doctorInfo = { phone: '', name: '', subdomain: '' };
    let doctorDoc = null;
    if (doctorId) {
      doctorDoc = await Doctor.findById(doctorId);
      if (doctorDoc) {
        doctorInfo = {
          phone: doctorDoc.whatsappNumber || doctorDoc.phone || '',
          name: doctorDoc.displayName || doctorDoc.name || '',
          subdomain: doctorDoc.subdomain || '',
        };
      }
    }

    // Check if slot is still available (exclusive booking - checks all modes)
    const slotBooked = await isSlotBooked(
      bookingData.date,
      bookingData.time,
      doctorId
    );

    if (slotBooked) {
      return NextResponse.json(
        { error: "This slot has already been booked. Please select another slot." },
        { status: 409 }
      );
    }

    // Create calendar event (required for booking confirmation)
    let calendarEvent;
    try {
      calendarEvent = await createCalendarEvent({
        date: bookingData.date,
        time: bookingData.time,
        name: bookingData.name,
        email: bookingData.email,
        whatsapp: bookingData.whatsapp,
        mode: bookingData.modeOfContact,
      });

      if (!calendarEvent || !calendarEvent.success) {
        console.error("Calendar event creation returned failure");
        return NextResponse.json(
          { error: "Failed to create calendar event. Please try again or contact support." },
          { status: 500 }
        );
      }
    } catch (calendarError) {
      console.error("Calendar event creation failed:", calendarError);
      return NextResponse.json(
        { error: "Failed to create calendar event. Please try again or contact support." },
        { status: 500 }
      );
    }

    // Create booking in database
    const booking = new Booking({
      doctorId: doctorId || undefined,
      name: bookingData.name,
      age: bookingData.age,
      gender: bookingData.gender,
      email: bookingData.email,
      whatsapp: bookingData.whatsapp,
      mode: bookingData.modeOfContact,
      modeId: bookingData.modeId,
      date: bookingData.date,
      time: bookingData.time,
      status: 'confirmed',
      eventId: calendarEvent.eventId || null,
      meetLink: calendarEvent.meetLink || null,
      calendarEventUrl: calendarEvent.htmlLink || null,
    });

    await booking.save();

    // Send to Wylto webhook for appointment confirmation message
    try {
      // Format phone number with +91 prefix
      const formattedPhone = bookingData.whatsapp.startsWith('+')
        ? bookingData.whatsapp
        : `+91${bookingData.whatsapp.replace(/^91/, '')}`;

      const webhookResponse = await fetch("https://server.wylto.com/webhook/CMTvOkb2eV0fi8SCxd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bookingData.name,
          phoneNumber: formattedPhone,
          age: bookingData.age,
          gender: bookingData.gender,
          email: bookingData.email,
          modeOfContact: bookingData.modeOfContact,
          mode: bookingData.modeOfContact,
          date: bookingData.date,
          time: bookingData.time,
          meetLink: calendarEvent.meetLink || "",
          calendarLink: calendarEvent.htmlLink || "",
          eventId: calendarEvent.eventId || "",
          bookingTime: new Date().toISOString(),
          bookingType: 'no_payment',
          status: "confirmed",
          pageSlug: bookingData.pageSlug,
          pageName: bookingData.pageName,
          // Doctor info for routing
          doctorPhone: doctorInfo.phone,
          doctorName: doctorInfo.name,
          doctorSubdomain: doctorInfo.subdomain,
        }),
      });

      if (webhookResponse.ok) {
        console.log("Wylto webhook sent successfully for OTP booking");
      } else {
        console.error("Wylto webhook failed:", await webhookResponse.text());
      }
    } catch (webhookError) {
      console.error("Webhook error:", webhookError);
      // Don't fail booking if webhook fails
    }

    // Send booking confirmation to patient (email + SMS)
    try {
      await sendBookingConfirmationToPatient({
        email: bookingData.email,
        patientName: bookingData.name,
        doctorName: doctorInfo.name,
        date: bookingData.date,
        time: bookingData.time,
        mode: bookingData.modeOfContact,
        meetLink: calendarEvent.meetLink || null,
        calendarEventUrl: calendarEvent.htmlLink || null,
      });
    } catch (emailErr) {
      console.error("Patient confirmation email error:", emailErr);
    }

    try {
      await sendSMS(
        bookingData.whatsapp,
        `Hi ${bookingData.name}, your appointment with ${doctorInfo.name} is confirmed for ${bookingData.date} at ${bookingData.time} (${bookingData.modeOfContact}).${calendarEvent.meetLink ? ` Meet link: ${calendarEvent.meetLink}` : ''} - CuraGo`
      );
    } catch (smsErr) {
      console.error("Patient confirmation SMS error:", smsErr);
    }

    // Send booking notification to the doctor (email + SMS)
    if (doctorDoc) {
      if (doctorDoc.email) {
        try {
          await sendBookingNotificationToDoctor({
            email: doctorDoc.email,
            doctorName: doctorInfo.name,
            patientName: bookingData.name,
            patientPhone: bookingData.whatsapp,
            patientEmail: bookingData.email,
            date: bookingData.date,
            time: bookingData.time,
            mode: bookingData.modeOfContact,
            calendarEventUrl: calendarEvent.htmlLink || null,
          });
        } catch (emailErr) {
          console.error("Doctor notification email error:", emailErr);
        }
      }

      const doctorPhone = doctorDoc.whatsappNumber || doctorDoc.phone;
      if (doctorPhone) {
        try {
          await sendSMS(
            doctorPhone,
            `New booking: ${bookingData.name} (+91${bookingData.whatsapp}) booked for ${bookingData.date} at ${bookingData.time} (${bookingData.modeOfContact}). - CuraGo`
          );
        } catch (smsErr) {
          console.error("Doctor notification SMS error:", smsErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Appointment booked successfully!",
      booking: {
        id: booking._id,
        name: bookingData.name,
        date: bookingData.date,
        time: bookingData.time,
        mode: bookingData.modeOfContact,
        meetLink: calendarEvent.meetLink || null,
        calendarEventUrl: calendarEvent.htmlLink || null,
        // Additional data for event tracking
        phone: bookingData.whatsapp,
        email: bookingData.email,
        eventId: calendarEvent.eventId || booking._id.toString(),
      },
    });

  } catch (error) {
    console.error("Error in verify-otp-and-book:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP and book", details: error.message },
      { status: 500 }
    );
  }
}
