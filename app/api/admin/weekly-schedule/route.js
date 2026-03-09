import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import WeeklySchedule from "@/models/WeeklySchedule";
import ConsultationMode from "@/models/ConsultationMode";
import TimeSlot from "@/models/TimeSlot";

// GET - Get weekly schedule (optionally filtered by modeId)
export async function GET(request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const modeId = searchParams.get("modeId");

    await connectDB();

    let query = {};
    if (modeId) {
      query.modeId = modeId;
    }

    const schedules = await WeeklySchedule.find(query)
      .populate('modeId', 'name displayName color')
      .sort({ modeId: 1, dayOfWeek: 1 });

    // Also get all time slots for reference
    const timeSlots = await TimeSlot.find({ isActive: true })
      .sort({ time: 1 });

    // Group schedules by mode
    const schedulesByMode = {};
    for (const schedule of schedules) {
      const modeIdStr = schedule.modeId._id.toString();
      if (!schedulesByMode[modeIdStr]) {
        schedulesByMode[modeIdStr] = {
          mode: schedule.modeId,
          days: {},
        };
      }
      schedulesByMode[modeIdStr].days[schedule.dayOfWeek] = {
        isEnabled: schedule.isEnabled,
        enabledSlots: schedule.enabledSlots,
      };
    }

    return NextResponse.json({
      success: true,
      schedules: Object.values(schedulesByMode),
      timeSlots,
      raw: schedules, // Raw data for debugging
    });
  } catch (error) {
    console.error("Error fetching weekly schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly schedule", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Update weekly schedule for a specific mode + day
export async function POST(request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { modeId, dayOfWeek, isEnabled, enabledSlots } = await request.json();

    if (!modeId || dayOfWeek === undefined) {
      return NextResponse.json(
        { error: "modeId and dayOfWeek are required" },
        { status: 400 }
      );
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { error: "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify mode exists
    const mode = await ConsultationMode.findById(modeId);
    if (!mode) {
      return NextResponse.json(
        { error: "Consultation mode not found" },
        { status: 404 }
      );
    }

    // Update or create schedule entry
    const updateData = {};
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
    if (enabledSlots !== undefined) updateData.enabledSlots = enabledSlots;

    const schedule = await WeeklySchedule.findOneAndUpdate(
      { modeId, dayOfWeek },
      updateData,
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      schedule,
      message: `Schedule updated for ${WeeklySchedule.getShortDayName(dayOfWeek)}`,
    });
  } catch (error) {
    console.error("Error updating weekly schedule:", error);
    return NextResponse.json(
      { error: "Failed to update weekly schedule", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Bulk update: Toggle a slot for a specific day/mode
export async function PATCH(request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { modeId, dayOfWeek, slotTime, enabled } = await request.json();

    if (!modeId || dayOfWeek === undefined || !slotTime) {
      return NextResponse.json(
        { error: "modeId, dayOfWeek, and slotTime are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const schedule = await WeeklySchedule.findOne({ modeId, dayOfWeek });
    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found for this mode and day" },
        { status: 404 }
      );
    }

    // Update enabledSlots array
    const slotIndex = schedule.enabledSlots.indexOf(slotTime);

    if (enabled && slotIndex === -1) {
      // Add slot
      schedule.enabledSlots.push(slotTime);
      schedule.enabledSlots.sort(); // Keep sorted
    } else if (!enabled && slotIndex !== -1) {
      // Remove slot
      schedule.enabledSlots.splice(slotIndex, 1);
    }

    await schedule.save();

    return NextResponse.json({
      success: true,
      schedule,
      message: `Slot ${slotTime} ${enabled ? 'enabled' : 'disabled'} for ${WeeklySchedule.getShortDayName(dayOfWeek)}`,
    });
  } catch (error) {
    console.error("Error toggling slot:", error);
    return NextResponse.json(
      { error: "Failed to toggle slot", details: error.message },
      { status: 500 }
    );
  }
}
