import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ConsultationMode from "@/models/ConsultationMode";
import Doctor from "@/models/Doctor";

// GET - List active consultation modes for a specific doctor (public endpoint for booking form)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const subdomain = searchParams.get('subdomain');

    // Build query - must have a doctor filter for multi-tenant
    const query = { isActive: true };

    if (doctorId) {
      query.doctorId = doctorId;
    } else if (subdomain) {
      // Look up doctor by subdomain
      const doctor = await Doctor.findOne({ subdomain: subdomain.toLowerCase() }).select('_id');
      if (doctor) {
        query.doctorId = doctor._id;
      } else {
        return NextResponse.json({
          success: true,
          modes: [],
        });
      }
    } else {
      // No doctor specified - return empty for security in multi-tenant
      return NextResponse.json({
        success: true,
        modes: [],
      });
    }

    const modes = await ConsultationMode.find(query)
      .select('_id name displayName description color sortOrder')
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
