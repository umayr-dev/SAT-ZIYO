/**
 * Verify OTP API Route
 * POST /api/auth/otp/verify
 * Verifies OTP locally, then calls external API to get JWT token
 * Stores JWT token in HttpOnly cookie for persistent authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyOTP, clearOTP } from "@/src/lib/server/otp-store";
import { API_CONFIG, API_ENDPOINTS } from "@/src/config/api";

const JWT_COOKIE_NAME = "token";
const JWT_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export async function POST(request: NextRequest) {
  try {
    const { email, otp, name, isRegister } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== "string") {
      return NextResponse.json(
        { error: "Valid OTP is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // First, verify OTP locally
    const isValid = await verifyOTP(normalizedEmail, otp);
    
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 401 }
      );
    }

    // Clear used OTP
    await clearOTP(normalizedEmail);

    // Now call external API to get JWT token
    // For register, we might need to send name as well
    const requestBody: { email: string; otp: string; name?: string } = {
      email: normalizedEmail,
      otp: otp,
    };

    if (isRegister && name) {
      requestBody.name = name;
    }

    const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.auth.verifyOtp}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || "Authentication failed" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract JWT token from response
    // API may return token in different fields: accessToken, token, access_token, jwt
    const token =
      data.accessToken ||
      data.token ||
      data.access_token ||
      data.jwt;

    if (!token) {
      console.error("Token not found in OTP verification response:", data);
      return NextResponse.json(
        { error: "Authentication failed. Token not received." },
        { status: 500 }
      );
    }

    // Create response with user data
    const apiResponse = NextResponse.json(
      {
        success: true,
        user: {
          id: data.id || data.user?.id,
          email: data.email || data.user?.email || normalizedEmail,
          name: data.name || data.user?.name || name,
          role: data.role || data.user?.role || "STUDENT",
        },
      },
      { status: 200 }
    );

    // Store JWT token in HttpOnly, Secure, SameSite=Lax cookie
    apiResponse.cookies.set(JWT_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: JWT_MAX_AGE,
      path: "/",
    });

    return apiResponse;
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP. Please try again." },
      { status: 500 }
    );
  }
}

