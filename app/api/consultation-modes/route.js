import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ConsultationMode from "@/models/ConsultationMode";
import Clinic from "@/models/Clinic";
import Doctor from "@/models/Doctor";

// Online booking is disabled for now — hide any "online" mode from the public
// booking form. To re-enable, set this flag to true.
const ONLINE_BOOKING_ENABLED = false;
const isOnlineMode = (m) => /online/i.test(m.name || "") || /online/i.test(m.displayName || "");

// GET - Public endpoint for the patient booking form.
// Returns the doctor's clinics, each with its active consultation modes, so the
// form can do: pick clinic → pick mode. Also returns a flat `modes` array
// (all clinics) for backward compatibility.
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const doctorIdParam = searchParams.get("doctorId");
    const subdomain = searchParams.get("subdomain");

    let doctorId = doctorIdParam;
    if (!doctorId && subdomain) {
      const doctor = await Doctor.findOne({ subdomain: subdomain.toLowerCase() }).select("_id");
      doctorId = doctor?._id || null;
    }
    if (!doctorId) {
      return NextResponse.json({ success: true, clinics: [], modes: [] });
    }

    const [allModes, clinicDocs] = await Promise.all([
      ConsultationMode.find({ doctorId, isActive: true })
        .select("_id name displayName description color sortOrder clinicId")
        .sort({ sortOrder: 1, createdAt: 1 })
        .lean(),
      Clinic.find({ doctorId }).select("_id name address phone isPrimary sortOrder").sort({ isPrimary: -1, sortOrder: 1, createdAt: 1 }).lean(),
    ]);

    const visibleModes = ONLINE_BOOKING_ENABLED ? allModes : allModes.filter((m) => !isOnlineMode(m));

    // Group modes by clinic.
    const byClinic = new Map();
    for (const m of visibleModes) {
      const k = m.clinicId ? String(m.clinicId) : "none";
      if (!byClinic.has(k)) byClinic.set(k, []);
      byClinic.get(k).push(m);
    }

    // Build clinics list — only those that have at least one visible mode.
    const clinics = clinicDocs
      .map((c) => ({
        _id: String(c._id),
        name: c.name,
        city: c.address?.city || "",
        phone: c.phone || "",
        modes: byClinic.get(String(c._id)) || [],
      }))
      .filter((c) => c.modes.length > 0);

    // Legacy/unassigned modes (no clinic) — surface under a fallback clinic so
    // booking still works before/without migration.
    const orphan = byClinic.get("none") || [];
    if (orphan.length) {
      clinics.push({ _id: "", name: clinicDocs[0]?.name || "Clinic", city: "", phone: "", modes: orphan });
    }

    return NextResponse.json({ success: true, clinics, modes: visibleModes });
  } catch (error) {
    console.error("Error fetching consultation modes:", error);
    return NextResponse.json(
      { error: "Failed to fetch consultation modes", details: error.message },
      { status: 500 }
    );
  }
}
