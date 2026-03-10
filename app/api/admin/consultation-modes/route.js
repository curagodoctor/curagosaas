import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getCurrentDoctor } from "@/lib/doctorAuth";
import connectDB from "@/lib/mongodb";
import ConsultationMode from "@/models/ConsultationMode";
import WeeklySchedule from "@/models/WeeklySchedule";
import Booking from "@/models/Booking";
import { initializeDefaultModes } from "@/lib/slotManagerDB";

// GET - List all consultation modes
export async function GET(request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const doctor = await getCurrentDoctor(request);
    const doctorId = doctor?._id;

    await connectDB();

    // Initialize default modes if none exist for this doctor
    await initializeDefaultModes(doctorId);

    const query = doctorId ? { doctorId } : {};
    const modes = await ConsultationMode.find(query)
      .sort({ sortOrder: 1, createdAt: 1 });

    return NextResponse.json({
      success: true,
      modes,
    });
  } catch (error) {
    console.error("Error fetching consultation modes:", error);
    return NextResponse.json(
      { error: "Failed to fetch consultation modes", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new consultation mode
export async function POST(request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const doctor = await getCurrentDoctor(request);
    const doctorId = doctor?._id;

    const { name, displayName, description, color } = await request.json();

    if (!name || !displayName) {
      return NextResponse.json(
        { error: "Name and display name are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if mode with same name exists for this doctor
    const existingQuery = { name: name.toLowerCase() };
    if (doctorId) existingQuery.doctorId = doctorId;
    const existing = await ConsultationMode.findOne(existingQuery);
    if (existing) {
      return NextResponse.json(
        { error: "A mode with this name already exists" },
        { status: 400 }
      );
    }

    // Get the highest sortOrder for this doctor
    const sortQuery = doctorId ? { doctorId } : {};
    const lastMode = await ConsultationMode.findOne(sortQuery).sort({ sortOrder: -1 });
    const sortOrder = lastMode ? lastMode.sortOrder + 1 : 1;

    const mode = new ConsultationMode({
      doctorId: doctorId || undefined,
      name: name.toLowerCase().replace(/\s+/g, '-'),
      displayName,
      description: description || '',
      color: color || '#3B82F6',
      sortOrder,
    });

    await mode.save();

    // Initialize weekly schedule for all days (disabled by default)
    for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
      await WeeklySchedule.create({
        doctorId: doctorId || undefined,
        modeId: mode._id,
        dayOfWeek,
        isEnabled: false,
        enabledSlots: [],
      });
    }

    return NextResponse.json({
      success: true,
      mode,
      message: "Consultation mode created successfully",
    });
  } catch (error) {
    console.error("Error creating consultation mode:", error);
    return NextResponse.json(
      { error: "Failed to create consultation mode", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update an existing consultation mode
export async function PATCH(request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const doctor = await getCurrentDoctor(request);
    const doctorId = doctor?._id;

    const { id, displayName, description, color, isActive, sortOrder } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Mode ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const query = { _id: id };
    if (doctorId) query.doctorId = doctorId;

    const mode = await ConsultationMode.findOne(query);
    if (!mode) {
      return NextResponse.json(
        { error: "Consultation mode not found" },
        { status: 404 }
      );
    }

    // Update fields if provided
    if (displayName !== undefined) mode.displayName = displayName;
    if (description !== undefined) mode.description = description;
    if (color !== undefined) mode.color = color;
    if (isActive !== undefined) mode.isActive = isActive;
    if (sortOrder !== undefined) mode.sortOrder = sortOrder;

    await mode.save();

    return NextResponse.json({
      success: true,
      mode,
      message: "Consultation mode updated successfully",
    });
  } catch (error) {
    console.error("Error updating consultation mode:", error);
    return NextResponse.json(
      { error: "Failed to update consultation mode", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a consultation mode
export async function DELETE(request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const doctor = await getCurrentDoctor(request);
    const doctorId = doctor?._id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Mode ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const query = { _id: id };
    if (doctorId) query.doctorId = doctorId;

    const mode = await ConsultationMode.findOne(query);
    if (!mode) {
      return NextResponse.json(
        { error: "Consultation mode not found" },
        { status: 404 }
      );
    }

    // Check if there are any bookings with this mode for this doctor
    const bookingQuery = { modeId: id };
    if (doctorId) bookingQuery.doctorId = doctorId;
    const bookingCount = await Booking.countDocuments(bookingQuery);
    if (bookingCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete mode with existing bookings",
          bookingCount,
          message: `There are ${bookingCount} bookings using this mode. Deactivate it instead.`
        },
        { status: 400 }
      );
    }

    // Delete weekly schedules for this mode
    const scheduleQuery = { modeId: id };
    if (doctorId) scheduleQuery.doctorId = doctorId;
    await WeeklySchedule.deleteMany(scheduleQuery);

    // Delete the mode
    await ConsultationMode.findOneAndDelete(query);

    return NextResponse.json({
      success: true,
      message: "Consultation mode deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting consultation mode:", error);
    return NextResponse.json(
      { error: "Failed to delete consultation mode", details: error.message },
      { status: 500 }
    );
  }
}
