/**
 * Get Available Exam Dates API Route
 * GET /api/exams/dates
 * Returns list of available exam dates from backend API
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

const JWT_COOKIE_NAME = "token";

export async function GET(request: NextRequest) {
  try {
    // Get JWT token from cookie
    const token = request.cookies.get(JWT_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { statusCode: 401, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Call backend API to get exam dates
    // Adjust endpoint based on your backend API structure
    const response = await fetch(`${API_CONFIG.baseURL}/exams/dates`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        statusCode: response.status,
        message: "Failed to fetch exam dates",
      }));

      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();

    // Return exam dates
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Get exam dates error:", error);
    return NextResponse.json(
      { statusCode: 500, message: "Failed to fetch exam dates" },
      { status: 500 }
    );
  }
}
