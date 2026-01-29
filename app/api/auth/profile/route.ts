/**
 * Update User Profile API Route
 * PATCH /api/auth/profile
 * Forwards to backend PATCH /auth/profile (name, currentPassword, newPassword, targetScore, examDate)
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

const JWT_COOKIE_NAME = "token";

export async function PATCH(request: NextRequest) {
  try {
    let token = request.cookies.get(JWT_COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { statusCode: 401, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${API_CONFIG.baseURL}/auth/profile`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        data?.message ? { message: data.message } : { message: "Failed to update profile" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}

