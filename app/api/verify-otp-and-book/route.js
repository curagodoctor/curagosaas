import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import OTP from "@/models/OTP";
import Booking from "@/models/Booking";
import { isSlotBooked } from "@/lib/slotManagerDB";
import { createCalendarEvent } from "@/lib/googleCalendar";
import { validatePhone } from "@/lib/validation";

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

    // Check if slot is still available (exclusive booking - checks all modes)
    const slotBooked = await isSlotBooked(
      bookingData.date,
      bookingData.time
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

      const webhookResponse = await fetch("https://server.wylto.com/webhook/HXfOyPxtr7nv35jSYf", {
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
