import { NextResponse } from "next/server";
import { releaseExpiredReservations } from "@/lib/slotManagerDB";

// GET endpoint for cron job to cleanup expired reservations
export async function GET(request) {
  try {
    // Optional: Add authentication for cron job
    // const authHeader = request.headers.get("authorization");
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const expiredCount = await releaseExpiredReservations();

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${expiredCount} expired reservations`,
      expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error cleaning up reservations:", error);
    return NextResponse.json(
      {
        error: "Failed to cleanup reservations",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
