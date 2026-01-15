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

    // Clear cookie immediately for fast logout
    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 }
    );

    // Clear JWT token cookie immediately
    response.cookies.delete(JWT_COOKIE_NAME);

    // Call external API logout in background (don't wait for it)
    if (token) {
      // Fire and forget - don't wait for backend response
      fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.auth.logout}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }).catch((error) => {
        // Silently handle errors - logout should succeed even if backend fails
        console.error("External logout API error:", error);
      });
    }

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    // Even on error, clear the cookie
    const errorResponse = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );
    errorResponse.cookies.delete(JWT_COOKIE_NAME);
    return errorResponse;
  }
}
