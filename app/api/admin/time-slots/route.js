import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import TimeSlot from "@/models/TimeSlot";
import WeeklySchedule from "@/models/WeeklySchedule";

// GET - List all time slots
export async function GET(request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get("all") === "true";

    await connectDB();

    let query = {};
    if (!includeAll) {
      query.isActive = true;
    }

    const slots = await TimeSlot.find(query).sort({ time: 1 });

    // Also return all possible slots that could be created
    const allPossibleSlots = TimeSlot.generateAllPossibleSlots();
    const existingTimes = slots.map(s => s.time);
    const availableToCreate = allPossibleSlots.filter(s => !existingTimes.includes(s.time));

    return NextResponse.json({
      success: true,
      slots,
      availableToCreate,
    });
  } catch (error) {
    console.error("Error fetching time slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch time slots", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Add a new time slot
export async function POST(request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { time, label } = await request.json();

    if (!time) {
      return NextResponse.json(
        { error: "Time is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if slot already exists
    const existing = await TimeSlot.findOne({ time });
    if (existing) {
      // If it exists but is inactive, reactivate it
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
        return NextResponse.json({
          success: true,
          slot: existing,
          message: "Time slot reactivated",
        });
      }
      return NextResponse.json(
        { error: "Time slot already exists" },
        { status: 400 }
      );
    }

    // Create new slot
    const slotLabel = label || TimeSlot.timeToLabel(time);
    const slot = new TimeSlot({
      time,
      label: slotLabel,
      isActive: true,
    });

    await slot.save();

    return NextResponse.json({
      success: true,
      slot,
      message: `Time slot ${slotLabel} created`,
    });
  } catch (error) {
    console.error("Error creating time slot:", error);
    return NextResponse.json(
      { error: "Failed to create time slot", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update time slot (toggle active status)
export async function PATCH(request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { time, isActive } = await request.json();

    if (!time) {
      return NextResponse.json(
        { error: "Time is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const slot = await TimeSlot.findOne({ time });
    if (!slot) {
      return NextResponse.json(
        { error: "Time slot not found" },
        { status: 404 }
      );
    }

    if (isActive !== undefined) {
      slot.isActive = isActive;
    }

    await slot.save();

    return NextResponse.json({
      success: true,
      slot,
      message: `Time slot ${slot.label} ${slot.isActive ? 'activated' : 'deactivated'}`,
    });
  } catch (error) {
    console.error("Error updating time slot:", error);
    return NextResponse.json(
      { error: "Failed to update time slot", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove a time slot
export async function DELETE(request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const time = searchParams.get("time");

    if (!time) {
      return NextResponse.json(
        { error: "Time is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const slot = await TimeSlot.findOne({ time });
    if (!slot) {
      return NextResponse.json(
        { error: "Time slot not found" },
        { status: 404 }
      );
    }

    // Remove this slot from all weekly schedules
    await WeeklySchedule.updateMany(
      { enabledSlots: time },
      { $pull: { enabledSlots: time } }
    );

    // Delete the time slot
    await TimeSlot.findByIdAndDelete(slot._id);

    return NextResponse.json({
      success: true,
      message: `Time slot ${slot.label} deleted`,
    });
  } catch (error) {
    console.error("Error deleting time slot:", error);
    return NextResponse.json(
      { error: "Failed to delete time slot", details: error.message },
      { status: 500 }
    );
  }
}
