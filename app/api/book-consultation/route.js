import { NextResponse } from "next/server";
import { addBooking, isSlotBooked } from "@/lib/slotManager";
import { createCalendarEvent } from "@/lib/googleCalendar";

export async function POST(request) {
  try {
    const { name, whatsapp, email, modeOfContact, date, time } =
      await request.json();

    // Validate required fields
    if (!name || !whatsapp || !email || !modeOfContact || !date || !time) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if slot is already booked (regardless of mode)
    if (isSlotBooked(date, time)) {
      return NextResponse.json(
        { error: "This time slot is already booked" },
        { status: 409 }
      );
    }

    // Create calendar event
    const calendarEvent = await createCalendarEvent({
      date,
      time,
      name,
      email,
      whatsapp,
      mode: modeOfContact,
    });

    if (!calendarEvent.success) {
      throw new Error("Failed to create calendar event");
    }

    // Store booking in database
    const booking = addBooking({
      name,
      whatsapp,
      email,
      mode: modeOfContact,
      date,
      time,
      eventId: calendarEvent.eventId,
      meetLink: calendarEvent.meetLink,
      htmlLink: calendarEvent.htmlLink,
    });

    // Send to webhook (existing implementation)
    try {
      await fetch("https://server.wylto.com/webhook/XLuJDKiLWjA5j49Y8S", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          whatsapp,
          email,
          modeOfContact,
          mode: modeOfContact,
          date,
          time,
          meetLink: calendarEvent.meetLink,
          calendarLink: calendarEvent.htmlLink,
          eventId: calendarEvent.eventId,
          bookingTime: new Date().toISOString(),
        }),
      });
    } catch (webhookError) {
      console.error("Webhook error:", webhookError);
      // Don't fail the booking if webhook fails
    }

    return NextResponse.json({
      success: true,
      message: "Consultation booked successfully",
      booking: {
        id: booking.id,
        date,
        time,
        mode: modeOfContact,
        meetLink: calendarEvent.meetLink,
      },
    });
  } catch (error) {
    console.error("Error booking consultation:", error);
    return NextResponse.json(
      {
        error: "Failed to book consultation",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
