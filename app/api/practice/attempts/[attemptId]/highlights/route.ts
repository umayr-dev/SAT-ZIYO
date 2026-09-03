/**
 * Highlights API Route
 * POST /api/practice/attempts/:attemptId/highlights
 * GET /api/practice/attempts/:attemptId/highlights
 *
 * Proxies to external API for highlights management
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
  { params }: { params: { attemptId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const { attemptId } = params;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // The backend scopes highlights to a question:
    //   POST /practice/attempts/:attemptId/questions/:questionId/highlights
    // This route used to post to /attempts/:id/highlights, which does not
    // exist and 404s.
    const questionId = body?.questionId;
    if (!questionId) {
      return NextResponse.json(
        { message: "questionId is required" },
        { status: 400 }
      );
    }
    const backendUrl = `${API_CONFIG.baseURL}/practice/attempts/${attemptId}/questions/${questionId}/highlights`;

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
            `Backend /highlights returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Highlights POST error:", error);
    return NextResponse.json(
      {
        message: "Failed to save highlights",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const { attemptId } = params;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    // Highlights are per-question on the backend; there is no attempt-wide
    // listing, so questionId is required rather than optional.
    if (!questionId) {
      return NextResponse.json(
        { message: "questionId query parameter is required" },
        { status: 400 }
      );
    }
    const backendUrl = `${API_CONFIG.baseURL}/practice/attempts/${attemptId}/questions/${encodeURIComponent(questionId)}/highlights`;

    const response = await fetch(backendUrl, {
      method: "GET",
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
            `Backend /highlights returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Highlights GET error:", error);
    return NextResponse.json(
      {
        message: "Failed to get highlights",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

