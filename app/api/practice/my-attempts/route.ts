/**
 * Practice My Attempts API Route
 * GET /api/practice/my-attempts
 * Get user's attempt history
 *
 * Proxies to external API `/practice/my-attempts` using JWT from HttpOnly cookie (`token`)
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

function getTokenFromRequest(request: NextRequest): string | null {
  let token = request.cookies.get("token")?.value || null;
  if (!token) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }
  return token;
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get("testId");

    const url = testId
      ? `${API_CONFIG.baseURL}/practice/my-attempts?testId=${testId}`
      : `${API_CONFIG.baseURL}/practice/my-attempts`;

    console.log("[My Attempts API] Fetching from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[My Attempts API] Backend error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      return NextResponse.json(
        { 
          message: errorData.message || errorData.error || "Failed to fetch attempts",
          error: errorData 
        },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[My Attempts API] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        message: "Failed to fetch attempts", 
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

