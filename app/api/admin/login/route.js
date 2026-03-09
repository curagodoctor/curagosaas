import { NextResponse } from "next/server";
import { verifyAdminCredentials, generateToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Trim whitespace from inputs
    const trimmedUsername = username?.trim();
    const trimmedPassword = password?.trim();

    if (!trimmedUsername || !trimmedPassword) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Verify credentials
    if (verifyAdminCredentials(trimmedUsername, trimmedPassword)) {
      // Generate JWT token
      const token = generateToken({ username: trimmedUsername, role: "admin" });

      return NextResponse.json({
        success: true,
        token,
        message: "Login successful",
      });
    } else {
      // Log failed attempt for debugging (without exposing password)
      console.error("Login failed for username:", trimmedUsername);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
