/**
 * Send OTP API Route
 * POST /api/auth/otp/send
 * Generates and sends OTP to user's email
 * Uses our own OTP generation and email service
 */

import { NextRequest, NextResponse } from "next/server";
import { generateOTP, storeOTP } from "@/src/lib/server/otp-store";
import { sendOTPEmail } from "@/src/lib/server/email-service";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Store OTP with 10-minute expiration
    await storeOTP(normalizedEmail, otp);

    // Send OTP via email service
    await sendOTPEmail(normalizedEmail, otp);

    // Return success (don't expose OTP in response)
    return NextResponse.json(
      {
        success: true,
        message: "OTP sent to your email",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}

