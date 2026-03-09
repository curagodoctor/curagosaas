import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getAllSlots } from "@/lib/slotManagerDB";

// GET - Get available time slots for a specific date
export async function GET(request) {
  try {
    // Verify admin token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const isValid = verifyToken(token);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    // Helper function to format time to AM/PM
    const formatTimeLabel = (hour, minute) => {
      const period = hour >= 12 ? 'PM' : 'AM';
      const hours12 = hour % 12 || 12;
      return `${hours12}:${String(minute).padStart(2, '0')} ${period}`;
    };

    // Get all existing slots from the system
    const existingSlots = await getAllSlots();
    const existingTimes = existingSlots.map(slot => slot.time);

    // Generate all possible time slots (full day: 00:00 to 23:30 in 30-min intervals)
    const allPossibleSlots = [];

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        allPossibleSlots.push({
          time,
          label: formatTimeLabel(hour, minute),
          exists: existingTimes.includes(time),
        });
      }
    }

    return NextResponse.json({
      success: true,
      slots: allPossibleSlots,
      date,
    });
  } catch (error) {
    console.error("Error fetching available times:", error);
    return NextResponse.json(
      { error: "Failed to fetch available times" },
      { status: 500 }
    );
  }
}
