/**
 * Get Current User API Route
 * GET /api/auth/me
 * Returns 200 with user data if JWT token is valid, 401 if not authenticated
 * Uses external API with JWT Bearer token authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

const JWT_COOKIE_NAME = "token";

export async function GET(request: NextRequest) {
  try {
    // Get JWT token from cookie (preferred) or Authorization header
    let token = request.cookies.get(JWT_COOKIE_NAME)?.value;
    
    // If no token in cookie, check Authorization header
    if (!token) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { statusCode: 401, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Call backend API with token to get current user
    // Backend validates token and returns user data
    const response = await fetch(`${API_CONFIG.baseURL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Token invalid or expired
      const errorData = await response.json().catch(() => ({
        statusCode: 401,
        message: "Unauthorized",
      }));

      const apiResponse = NextResponse.json(errorData, {
        status: response.status,
      });

      // Clear invalid token cookie
      apiResponse.cookies.delete(JWT_COOKIE_NAME);
      return apiResponse;
    }

    const userData = await response.json();

    // Return user data
    return NextResponse.json(userData, { status: 200 });
  } catch (error) {
    console.error("Get current user error:", error);

    const apiResponse = NextResponse.json(
      { statusCode: 500, message: "Failed to get user" },
      { status: 500 }
    );

    // Clear token on error
    apiResponse.cookies.delete(JWT_COOKIE_NAME);
    return apiResponse;
  }
}
