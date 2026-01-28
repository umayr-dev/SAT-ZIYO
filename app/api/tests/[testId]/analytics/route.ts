/**
 * Test Analytics API Route
 * GET /api/tests/:testId/analytics
 *
 * Proxies to external API for test analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params;

    const backendUrl = `${API_CONFIG.baseURL}/tests/${testId}/analytics`;

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
            `Backend /tests/analytics returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Test Analytics GET error:", error);
    return NextResponse.json(
      {
        message: "Failed to get test analytics",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

