/**
 * Jump to Specific Question API Route
 * POST /api/practice/attempts/:attemptId/goto/:questionIndex
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

export async function POST(
  request: NextRequest,
  {
    params,
  }: { params: { attemptId: string; questionIndex: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const { attemptId, questionIndex } = params;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const backendUrl = `${API_CONFIG.baseURL}/practice/attempts/${attemptId}/goto/${questionIndex}`;

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            data.message ||
            data.error ||
            `Backend /practice/attempts/goto returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Practice goto POST error:", error);
    return NextResponse.json(
      {
        message: "Failed to jump to question",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


