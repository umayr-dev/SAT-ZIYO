/**
 * Send OTP API Route
 * POST /api/auth/otp/send
 * Forwards OTP request to backend API
 * Backend API handles OTP generation and email sending
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG, API_ENDPOINTS } from "@/src/config/api";

export async function POST(request: NextRequest) {
  try {
    const { email, isRegister, password, name } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Forward to backend API - backend will generate OTP and send email
    // Backend handles OTP generation and email delivery
    const endpoint = isRegister
      ? API_ENDPOINTS.auth.register
      : API_ENDPOINTS.auth.login;

    // Backend expects full request body with email, password, and name (for register)
    const requestBody: { email: string; password: string; name?: string } = {
      email: normalizedEmail,
      password: password,
    };

    // For registration, include name
    if (isRegister && name) {
      requestBody.name = name;
    }

    try {
      const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          {
            error: errorData.message || "Failed to send OTP. Please try again.",
          },
          { status: response.status }
        );
      }

      const data = await response.json();

      // Backend should send OTP via email
      // We return success
      return NextResponse.json(
        {
          success: true,
          message: data.message || "OTP sent to your email",
        },
        { status: 200 }
      );
    } catch (apiError) {
      console.error("Backend API error:", apiError);
      return NextResponse.json(
        { error: "Failed to connect to server. Please try again." },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
