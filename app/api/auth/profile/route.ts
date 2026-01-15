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

    // According to OpenAPI spec, backend API does not have a PATCH endpoint for /auth/me
    // Backend needs to add PATCH method to /auth/me or create /auth/profile endpoint
    // For now, we'll try /auth/me with PATCH (in case it's added in the future)
    // and return a clear error message if it doesn't exist

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
        message:
          response.status === 404
            ? "Profile update endpoint not found. Backend API needs to add PATCH method to /auth/me endpoint."
            : "Failed to update profile",
      }));

      console.error("Profile update failed:", {
        status: response.status,
        error: errorData,
        attemptedEndpoint: "/auth/me",
        note: "Backend API does not have PATCH endpoint for profile updates. Need to add PATCH to /auth/me or create /auth/profile endpoint.",
      });

      return NextResponse.json(
        {
          statusCode: response.status,
          message: errorData.message || "Failed to update profile",
          error:
            response.status === 404
              ? "Backend API does not support PATCH method for /auth/me. Please add PATCH endpoint to backend API for profile updates."
              : errorData.error || "Unknown error",
        },
        { status: response.status }
      );
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
