import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { resetTimeSlots } from "@/lib/slotManagerDB";

// POST - Reset all time slots to defaults (6 AM - 10 PM)
export async function POST(request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await resetTimeSlots();

    return NextResponse.json({
      success: true,
      message: `Time slots reset successfully. Created ${result.count} slots (6 AM - 10 PM)`,
    });
  } catch (error) {
    console.error("Error resetting time slots:", error);
    return NextResponse.json(
      { error: "Failed to reset time slots", details: error.message },
      { status: 500 }
    );
  }
}
