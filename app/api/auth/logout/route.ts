/**
 * Logout API Route
 * POST /api/auth/logout
 * Clears the JWT token cookie and calls external API logout
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG, API_ENDPOINTS } from "@/src/config/api";

const JWT_COOKIE_NAME = "token";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(JWT_COOKIE_NAME)?.value;

    // Call external API logout if token exists
    if (token) {
      try {
        await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.auth.logout}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        // Continue with cookie deletion even if API call fails
        console.error("External logout API error:", error);
      }
    }

    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 }
    );

    // Clear JWT token cookie
    response.cookies.delete(JWT_COOKIE_NAME);

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
