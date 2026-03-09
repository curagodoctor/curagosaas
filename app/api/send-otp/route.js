import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import OTP from "@/models/OTP";
import {
  validatePhone,
  validateEmail,
  validateDate,
  validateTime,
} from "@/lib/validation";

const WYLTO_API_KEY = process.env.WYLTO_OTP_API_KEY;
const WYLTO_API_URL = "https://server.wylto.com/api/v1/wa/send?sync=true";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      age,
      gender,
      email,
      whatsapp,
      modeOfContact,
      modeId,
      date,
      time,
      pageSlug,
      pageName,
    } = body;

    // Validate required fields
    if (!name || !whatsapp || !email || !modeOfContact || !date || !time) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate phone number format
    const phoneValidation = validatePhone(whatsapp);
    if (!phoneValidation.valid) {
      return NextResponse.json({ error: phoneValidation.error }, { status: 400 });
    }
    const phone = phoneValidation.cleanPhone;

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 });
    }

    // Validate date
    const dateValidation = validateDate(date);
    if (!dateValidation.valid) {
      return NextResponse.json({ error: dateValidation.error }, { status: 400 });
    }

    // Validate time
    const timeValidation = validateTime(time);
    if (!timeValidation.valid) {
      return NextResponse.json({ error: timeValidation.error }, { status: 400 });
    }

    await connectDB();

    // Generate and store OTP
    const bookingData = {
      name: name.trim(),
      age: parseInt(age, 10),
      gender,
      email: email.toLowerCase().trim(),
      whatsapp: phone,
      modeOfContact,
      modeId,
      date,
      time,
      pageSlug,
      pageName,
    };

    const { otp, expiresAt, id } = await OTP.createOTP(phone, bookingData);

    // Send OTP via Wylto WhatsApp API
    const fullPhone = `91${phone}`;

    try {
      const wyltoResponse = await fetch(WYLTO_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${WYLTO_API_KEY}`,
        },
        body: JSON.stringify({
          to: fullPhone,
          message: {
            type: "template",
            template: {
              templateName: "otp_template",
              language: "en_US",
              body: [
                { type: "text", text: otp },
                { type: "text", text: otp },
                { type: "text", text: otp },
                { type: "text", text: otp },
              ],
              buttons: [
                { type: "url", payload: otp },
              ],
              category: "AUTHENTICATION",
            },
          },
        }),
      });

      if (!wyltoResponse.ok) {
        const errorText = await wyltoResponse.text();
        console.error("Wylto API error:", errorText);
        // Don't fail the request - OTP is stored, user can try again
      }
    } catch (wyltoError) {
      console.error("Error sending OTP via Wylto:", wyltoError);
      // Don't fail the request - OTP is stored
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      otpId: id,
      expiresAt,
      // Don't send OTP in response for security - only for development
      ...(process.env.NODE_ENV === 'development' && { otp }),
    });

  } catch (error) {
    console.error("Error in send-otp:", error);
    return NextResponse.json(
      { error: "Failed to send OTP", details: error.message },
      { status: 500 }
    );
  }
}
