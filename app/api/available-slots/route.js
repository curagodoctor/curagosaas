import { NextResponse } from "next/server";
import {
  getEffectiveSlotsForDate,
  isSlotBooked,
  releaseExpiredReservations,
  getActiveConsultationModes,
  getModeById,
  getModeByName,
} from "@/lib/slotManagerDB";
import { format, addDays, startOfDay } from "date-fns";

// GET - Get available slots for users
export async function GET(request) {
  try {
    // Auto-cleanup expired reservations
    await releaseExpiredReservations();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const modeId = searchParams.get("modeId");
    const modeName = searchParams.get("mode"); // For backward compatibility

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    // Get mode - either by ID or by name (for backward compatibility)
    let mode = null;
    if (modeId) {
      mode = await getModeById(modeId);
    } else if (modeName) {
      mode = await getModeByName(modeName);
    }

    if (!mode) {
      // If no mode specified, get first available mode
      const modes = await getActiveConsultationModes();
      if (modes.length > 0) {
        mode = modes[0];
      } else {
        return NextResponse.json({
          success: true,
          dates: [],
          slots: [],
          message: "No consultation modes available",
        });
      }
    }

    // Get effective slots for this date and mode (using WeeklySchedule)
    const effectiveSlots = await getEffectiveSlotsForDate(date, mode._id);

    // Get current time in IST (UTC + 5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
    const today = format(istTime, "yyyy-MM-dd");
    const currentTime = format(istTime, "HH:mm");

    // Filter out past slots and apply minimum booking time based on mode
    const filteredSlots = effectiveSlots.filter((slot) => {
      // If the selected date is today, apply time restrictions
      if (date === today) {
        // Default buffer: 60 minutes (can be customized per mode later)
        const bufferMinutes = 60;

        // Parse current time and slot time
        const [currentHour, currentMinute] = currentTime.split(':').map(Number);
        const [slotHour, slotMinute] = slot.time.split(':').map(Number);

        // Convert to minutes since midnight for easy comparison
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        const slotTotalMinutes = slotHour * 60 + slotMinute;

        // Slot must be at least bufferMinutes in the future
        return slotTotalMinutes >= (currentTotalMinutes + bufferMinutes);
      }
      // For future dates, show all slots
      return true;
    });

    // Check which slots are already booked (EXCLUSIVE - checks all modes)
    const availableSlots = await Promise.all(
      filteredSlots.map(async (slot) => {
        const booked = await isSlotBooked(date, slot.time);
        return {
          time: slot.time,
          label: slot.label,
          active: slot.isActive,
          available: !booked,
        };
      })
    );

    // Generate next 7 days
    const todayStart = startOfDay(new Date());
    const dates = Array.from({ length: 7 }, (_, i) => {
      const dateObj = addDays(todayStart, i);
      return {
        date: format(dateObj, "yyyy-MM-dd"),
        label: format(dateObj, "EEE, MMM d"),
        isToday: i === 0,
      };
    });

    return NextResponse.json({
      success: true,
      dates,
      slots: availableSlots,
      mode: {
        _id: mode._id,
        name: mode.name,
        displayName: mode.displayName,
        color: mode.color,
      },
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch available slots" },
      { status: 500 }
    );
  }
}
