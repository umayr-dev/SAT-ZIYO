/**
 * Update User Profile API Route
 * PATCH /api/auth/profile
 * Updates user profile using cookie-based authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

const JWT_COOKIE_NAME = "token";

export async function PATCH(request: NextRequest) {
  try {
    // Get JWT token from cookie
    const token = request.cookies.get(JWT_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { statusCode: 401, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Call external API to update profile
    const response = await fetch(`${API_CONFIG.baseURL}/auth/me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        statusCode: response.status,
        message: "Failed to update profile",
      }));

      return NextResponse.json(errorData, { status: response.status });
    }

    const userData = await response.json();

    // Return updated user data
    return NextResponse.json(userData, { status: 200 });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { statusCode: 500, message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
