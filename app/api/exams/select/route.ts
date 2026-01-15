/**
 * Select Exam Date API Route
 * POST /api/exams/select
 * Saves user's selected exam date to backend API
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

const JWT_COOKIE_NAME = "token";

export async function POST(request: NextRequest) {
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
    const { examDateId } = body;

    if (!examDateId) {
      return NextResponse.json(
        { statusCode: 400, message: "Exam date ID is required" },
        { status: 400 }
      );
    }

    // Call backend API to save selected exam date
    // Adjust endpoint based on your backend API structure
    const response = await fetch(`${API_CONFIG.baseURL}/exams/select`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ examDateId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        statusCode: response.status,
        message: "Failed to save exam date",
      }));

      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();

    // Return success response
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Select exam date error:", error);
    return NextResponse.json(
      { statusCode: 500, message: "Failed to save exam date" },
      { status: 500 }
    );
  }
}
