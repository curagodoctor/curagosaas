import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  confirmReservation,
  getReservationById,
} from "@/lib/slotManagerDB";
import { createCalendarEvent } from "@/lib/googleCalendar";

// Verify Razorpay payment signature
function verifyRazorpaySignature(paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(paymentId)
    .digest("hex");

  return expectedSignature === signature;
}

export async function POST(request) {
  try {
    const {
      razorpay_payment_id,
      razorpay_signature,
      reservationId,
    } = await request.json();

    // Validate required fields
    if (!razorpay_payment_id || !reservationId) {
      return NextResponse.json(
        { error: "Payment ID and reservation ID are required" },
        { status: 400 }
      );
    }

    // If signature is provided (custom checkout), verify it
    // If signature is "payment_button", skip signature verification (payment button flow)
    if (razorpay_signature && razorpay_signature !== "payment_button") {
      const isValidSignature = verifyRazorpaySignature(
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isValidSignature) {
        return NextResponse.json(
          { error: "Invalid payment signature" },
          { status: 400 }
        );
      }
    }

    // For payment button, verify by fetching payment from Razorpay API
    if (razorpay_signature === "payment_button") {
      try {
        const auth = Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
        ).toString("base64");

        const paymentResponse = await fetch(
          `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
            },
          }
        );

        if (!paymentResponse.ok) {
          return NextResponse.json(
            { error: "Failed to verify payment with Razorpay" },
            { status: 400 }
          );
        }

        const paymentData = await paymentResponse.json();

        // Check if payment is captured/successful
        if (paymentData.status !== "captured" && paymentData.status !== "authorized") {
          return NextResponse.json(
            { error: `Payment status is ${paymentData.status}. Payment not successful.` },
            { status: 400 }
          );
        }

        console.log("Payment verified from Razorpay API:", paymentData);
      } catch (error) {
        console.error("Error fetching payment from Razorpay:", error);
        return NextResponse.json(
          { error: "Failed to verify payment" },
          { status: 500 }
        );
      }
    }

    // Get reservation details
    const reservation = await getReservationById(reservationId);

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Check if reservation has expired
    const expiryTime = new Date(reservation.expiryTime);
    const now = new Date();
    if (expiryTime < now) {
      return NextResponse.json(
        { error: "Reservation has expired. Please book again." },
        { status: 410 }
      );
    }

    // Create calendar event
    const calendarEvent = await createCalendarEvent({
      date: reservation.date,
      time: reservation.time,
      name: reservation.name,
      email: reservation.email,
      whatsapp: reservation.whatsapp,
      mode: reservation.mode,
    });

    if (!calendarEvent.success) {
      return NextResponse.json(
        {
          error: "Payment verified but failed to create calendar event",
          details: "Please contact support with your payment ID",
        },
        { status: 500 }
      );
    }

    // Confirm the reservation (convert to confirmed booking)
    const confirmResult = await confirmReservation(reservationId, {
      paymentId: razorpay_payment_id,
      paymentSignature: razorpay_signature,
      eventId: calendarEvent.eventId,
      meetLink: calendarEvent.meetLink,
      calendarEventUrl: calendarEvent.htmlLink,
    });

    if (!confirmResult.success) {
      return NextResponse.json(
        { error: confirmResult.message },
        { status: 400 }
      );
    }

    // Send to webhook
    try {
      const webhookResponse = await fetch("https://server.wylto.com/webhook/HXfOyPxtr7nv35jSYf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reservation.name,
          age: reservation.age,
          gender: reservation.gender,
          phoneNumber: reservation.whatsapp,
          email: reservation.email,
          whatsapp: reservation.whatsapp,
          modeOfContact: reservation.mode,
          mode: reservation.mode,
          date: reservation.date,
          time: reservation.time,
          meetLink: calendarEvent.meetLink || "",
          calendarLink: calendarEvent.htmlLink || "",
          eventId: calendarEvent.eventId || "",
          paymentId: razorpay_payment_id,
          bookingTime: new Date().toISOString(),
          paymentVerified: true,
          status: "confirmed",
        }),
      });

      if (webhookResponse.ok) {
        console.log("Webhook sent successfully");
      } else {
        console.error("Webhook failed:", await webhookResponse.text());
      }
    } catch (webhookError) {
      console.error("Webhook error:", webhookError);
      // Don't fail the booking if webhook fails
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and booking confirmed",
      booking: {
        id: confirmResult.booking.id,
        date: reservation.date,
        time: reservation.time,
        mode: reservation.mode,
        name: reservation.name,
        meetLink: calendarEvent.meetLink,
        calendarEventUrl: calendarEvent.htmlLink,
        paymentId: razorpay_payment_id,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      {
        error: "Failed to verify payment",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
