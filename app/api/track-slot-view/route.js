import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import SlotView from "@/models/SlotView";

export async function POST(request) {
  try {
    await connectDB();

    const {
      name,
      age,
      gender,
      email,
      whatsapp,
      modeOfContact,
      pageName,
      pageSlug,
      referrer,
      userAgent
    } = await request.json();

    // Validate required fields
    if (!name || !age || !gender || !email || !whatsapp || !modeOfContact) {
      return NextResponse.json(
        { error: "All user fields are required" },
        { status: 400 }
      );
    }

    // Create slot view record
    const slotView = await SlotView.create({
      name,
      age,
      gender,
      email,
      whatsapp,
      modeOfContact,
      pageName: pageName || 'Unknown',
      pageSlug: pageSlug || 'unknown',
      referrer: referrer || 'direct',
      userAgent: userAgent || 'unknown',
    });

    return NextResponse.json({
      success: true,
      message: "Slot view tracked successfully",
      id: slotView._id,
    });
  } catch (error) {
    console.error("Error tracking slot view:", error);
    return NextResponse.json(
      {
        error: "Failed to track slot view",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
