import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getCurrentDoctor } from "@/lib/doctorAuth";
import {
  blockDate,
  unblockDate,
  getBlockedDates,
  setDateSlotOverrides,
  getAllDateOverrides,
  clearDateOverride,
} from "@/lib/slotManagerDB";

// GET - Get all date overrides
export async function GET(request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const doctor = await getCurrentDoctor(request);
    const doctorId = doctor?._id;

    const overrides = await getAllDateOverrides(doctorId);
    return NextResponse.json({
      success: true,
      overrides,
    });
  } catch (error) {
    console.error("Error fetching date overrides:", error);
    return NextResponse.json(
      { error: "Failed to fetch date overrides" },
      { status: 500 }
    );
  }
}

// POST - Block a date or set date-specific slots
export async function POST(request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const doctor = await getCurrentDoctor(request);
    const doctorId = doctor?._id;

    const { action, date, reason, slotOverrides } = await request.json();

    if (!action || !date) {
      return NextResponse.json(
        { error: "Action and date are required" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "block":
        result = await blockDate(date, reason, doctorId);
        return NextResponse.json({
          success: true,
          message: "Date blocked successfully",
          override: result,
        });

      case "unblock":
        result = await unblockDate(date, doctorId);
        return NextResponse.json({
          success: true,
          message: result ? "Date unblocked successfully" : "Date was not blocked",
        });

      case "setSlots":
        if (!slotOverrides) {
          return NextResponse.json(
            { error: "Slot overrides are required" },
            { status: 400 }
          );
        }
        result = await setDateSlotOverrides(date, slotOverrides, doctorId);
        return NextResponse.json({
          success: true,
          message: "Date slot overrides set successfully",
          override: result,
        });

      case "clearSlots":
        // Clear custom slots by deleting the date override
        result = await clearDateOverride(date, doctorId);
        return NextResponse.json({
          success: true,
          message: "Date slot overrides cleared successfully",
        });

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error managing date overrides:", error);
    return NextResponse.json(
      { error: "Failed to manage date overrides" },
      { status: 500 }
    );
  }
}
