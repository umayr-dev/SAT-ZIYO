/**
 * Admin Test Validation API Route
 * GET /api/admin/tests/:testId/validate
 * Validates test structure and checks if all modules have required questions
 *
 * Proxies to external API `/tests/:testId/validate` using JWT from HttpOnly cookie (`token`)
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

export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const { testId } = params;

    const response = await fetch(
      `${API_CONFIG.baseURL}/tests/${testId}/validate`,
      {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Admin test validation error:", error);
    return NextResponse.json(
      { message: "Failed to validate test", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

