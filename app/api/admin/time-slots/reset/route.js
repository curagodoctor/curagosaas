import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getCurrentDoctor } from "@/lib/doctorAuth";
import { resetTimeSlots } from "@/lib/slotManagerDB";

// POST - Reset all time slots to defaults (6 AM - 10 PM)
export async function POST(request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const doctor = await getCurrentDoctor(request);
    const doctorId = doctor?._id;

    const result = await resetTimeSlots(doctorId);

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
