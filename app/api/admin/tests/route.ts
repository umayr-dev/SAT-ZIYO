/**
 * Admin Tests API Route
 * GET /api/admin/tests    - Get all tests (admin)
 * POST /api/admin/tests   - Create new test (admin)
 *
 * Proxies to external API `/tests` using JWT from HttpOnly cookie (`token`)
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

    const response = await fetch(`${API_CONFIG.baseURL}/tests`, {
      method: "GET",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Admin tests GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch tests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const body = await request.json();

    const response = await fetch(`${API_CONFIG.baseURL}/tests`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Admin tests POST error:", error);
    return NextResponse.json(
      { message: "Failed to create test" },
      { status: 500 }
    );
  }
}


