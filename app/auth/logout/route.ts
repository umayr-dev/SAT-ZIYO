/**
 * Logout API Route
 * Server Action for logging out users
 * Clears session cookie
 */

import { NextResponse } from "next/server";
import { otpAuthService } from "@/src/services/otp-auth.service";

export async function POST() {
  try {
    await otpAuthService.logout();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to logout" },
      { status: 500 }
    );
  }
}
