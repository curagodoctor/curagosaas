import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
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
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const overrides = await getAllDateOverrides();
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
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
        result = await blockDate(date, reason);
        return NextResponse.json({
          success: true,
          message: "Date blocked successfully",
          override: result,
        });

      case "unblock":
        result = await unblockDate(date);
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
        result = await setDateSlotOverrides(date, slotOverrides);
        return NextResponse.json({
          success: true,
          message: "Date slot overrides set successfully",
          override: result,
        });

      case "clearSlots":
        // Clear custom slots by deleting the date override
        result = await clearDateOverride(date);
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
