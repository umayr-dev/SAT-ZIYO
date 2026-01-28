/**
 * Comment Thread API Route
 * GET /api/comments/:commentId/thread
 *
 * Proxies to external API for full comment thread
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const { commentId } = params;
    const { searchParams } = new URL(request.url);
    const maxDepth = searchParams.get("maxDepth") || "10";

    const backendUrl = `${API_CONFIG.baseURL}/comments/${commentId}/thread?maxDepth=${maxDepth}`;

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
            `Backend /comments/thread returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Thread GET error:", error);
    return NextResponse.json(
      {
        message: "Failed to get thread",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

