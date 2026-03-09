import { NextResponse } from "next/server";
import {
  createReservation,
  isSlotBooked,
  releaseExpiredReservations,
} from "@/lib/slotManagerDB";
import {
  validateBookingData,
  validatePhone,
  validateEmail,
  validateDate,
  validateTime,
} from "@/lib/validation";

export async function POST(request) {
  try {
    // Auto-cleanup expired reservations before checking availability
    await releaseExpiredReservations();

    const { name, age, gender, whatsapp, email, modeOfContact, modeId, date, time } =
      await request.json();

    // Validate required fields
    if (!name || !age || !gender || !whatsapp || !email || !modeOfContact || !modeId || !date || !time) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate input formats
    const phoneValidation = validatePhone(whatsapp);
    if (!phoneValidation.valid) {
      return NextResponse.json({ error: phoneValidation.error }, { status: 400 });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 });
    }

    const dateValidation = validateDate(date);
    if (!dateValidation.valid) {
      return NextResponse.json({ error: dateValidation.error }, { status: 400 });
    }

    const timeValidation = validateTime(time);
    if (!timeValidation.valid) {
      return NextResponse.json({ error: timeValidation.error }, { status: 400 });
    }

    // Check if slot is already booked or reserved
    const isBooked = await isSlotBooked(date, time);
    if (isBooked) {
      return NextResponse.json(
        { error: "This time slot is already booked or reserved" },
        { status: 409 }
      );
    }

    // Create temporary reservation (10-minute hold)
    const reservation = await createReservation({
      name: name.trim(),
      age: parseInt(age, 10),
      gender,
      whatsapp: `+91${phoneValidation.cleanPhone}`,
      email: email.toLowerCase().trim(),
      mode: modeOfContact,
      modeId,
      date,
      time,
    });

    // Calculate time remaining (in seconds) for countdown
    const expiryTime = new Date(reservation.expiryTime);
    const now = new Date();
    const timeRemaining = Math.floor((expiryTime - now) / 1000);

    return NextResponse.json({
      success: true,
      message: "Slot reserved successfully",
      reservation: {
        id: reservation.id,
        expiryTime: reservation.expiryTime,
        timeRemaining, // seconds
      },
    });
  } catch (error) {
    console.error("Error reserving slot:", error);
    return NextResponse.json(
      {
        error: "Failed to reserve slot",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
