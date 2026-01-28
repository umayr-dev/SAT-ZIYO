/**
 * Test Comments API Route
 * GET /api/tests/:testId/comments
 * POST /api/tests/:testId/comments
 *
 * Proxies to external API for comments management
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
    const { testId } = params;
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";

    const backendUrl = `${API_CONFIG.baseURL}/tests/${testId}/comments?page=${page}&limit=${limit}`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
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
            `Backend /tests/comments returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Comments GET error:", error);
    return NextResponse.json(
      {
        message: "Failed to get comments",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const { testId } = params;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const backendUrl = `${API_CONFIG.baseURL}/tests/${testId}/comments`;

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            data.message ||
            data.error ||
            `Backend /tests/comments returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Comments POST error:", error);
    return NextResponse.json(
      {
        message: "Failed to create comment",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

