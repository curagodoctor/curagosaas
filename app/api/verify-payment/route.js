import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  confirmReservation,
  getReservationById,
} from "@/lib/slotManagerDB";
import { createCalendarEvent } from "@/lib/googleCalendar";
import connectDB from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import { sendBookingConfirmationToPatient, sendBookingNotificationToDoctor } from "@/lib/email";
import { fireWyltoWebhook, toE164 } from "@/lib/wylto";
import { getClinicName } from "@/lib/clinicName";
import { sendSMS } from "@/lib/twilio";

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

    await connectDB();

    // Get reservation details
    const reservation = await getReservationById(reservationId);

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Fetch doctor info for webhook
    let doctorInfo = { phone: '', name: '', subdomain: '' };
    if (reservation.doctorId) {
      const doctor = await Doctor.findById(reservation.doctorId);
      if (doctor) {
        doctorInfo = {
          phone: doctor.whatsappNumber || doctor.phone || '',
          name: doctor.displayName || doctor.name || '',
          subdomain: doctor.subdomain || '',
        };
      }
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

    // Appointment Booked — one WhatsApp confirmation to the patient AND the doctor.
    try {
      const context = {
        date: reservation.date,
        time: reservation.time,
        appointmentDate: reservation.date,
        appointmentTime: reservation.time,
        mode: reservation.mode,
        meetLink: calendarEvent.meetLink || '',
        doctorName: doctorInfo.name,
        clinicName: reservation.clinicName || (await getClinicName(reservation.doctorId)) || doctorInfo.name,
        clinicPhone: toE164(doctorInfo.phone),
        patientName: reservation.name,
      };
      await Promise.all([
        fireWyltoWebhook('appointmentBooked', { name: reservation.name, phoneNumber: reservation.whatsapp, ...context }),
        doctorInfo.phone
          ? fireWyltoWebhook('appointmentBooked', { name: doctorInfo.name, phoneNumber: doctorInfo.phone, ...context, patientPhone: reservation.whatsapp })
          : Promise.resolve(),
      ]);
    } catch (webhookError) {
      console.error('[Appointment booked webhook]', webhookError);
      // Never fail the booking if the webhook fails.
    }

    // Send booking confirmation to patient (email + SMS)
    try {
      await sendBookingConfirmationToPatient({
        email: reservation.email,
        patientName: reservation.name,
        doctorName: doctorInfo.name,
        date: reservation.date,
        time: reservation.time,
        mode: reservation.mode,
        meetLink: calendarEvent.meetLink || null,
        calendarEventUrl: calendarEvent.htmlLink || null,
      });
    } catch (emailErr) {
      console.error("Patient confirmation email error:", emailErr);
    }

    try {
      await sendSMS(
        reservation.whatsapp,
        `Hi ${reservation.name}, your appointment with ${doctorInfo.name} is confirmed for ${reservation.date} at ${reservation.time} (${reservation.mode}). Payment received.${calendarEvent.meetLink ? ` Meet link: ${calendarEvent.meetLink}` : ''} - CuraGo`
      );
    } catch (smsErr) {
      console.error("Patient confirmation SMS error:", smsErr);
    }

    // Send booking notification to doctor (email + SMS)
    if (reservation.doctorId) {
      const doctor = await Doctor.findById(reservation.doctorId);
      if (doctor) {
        try {
          await sendBookingNotificationToDoctor({
            email: doctor.email,
            doctorName: doctorInfo.name,
            patientName: reservation.name,
            patientPhone: reservation.whatsapp,
            patientEmail: reservation.email,
            date: reservation.date,
            time: reservation.time,
            mode: reservation.mode,
            calendarEventUrl: calendarEvent.htmlLink || null,
          });
        } catch (emailErr) {
          console.error("Doctor notification email error:", emailErr);
        }

        try {
          await sendSMS(
            doctor.whatsappNumber || doctor.phone,
            `New paid booking: ${reservation.name} (+91${reservation.whatsapp}) booked for ${reservation.date} at ${reservation.time} (${reservation.mode}). Payment confirmed. - CuraGo`
          );
        } catch (smsErr) {
          console.error("Doctor notification SMS error:", smsErr);
        }
      }
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
