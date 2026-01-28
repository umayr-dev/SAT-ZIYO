/**
 * Get Percentile API Route
 * GET /api/scoring/percentile/:score
 *
 * Proxies to backend API `/scoring/percentile/:score`
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { score: string } }
) {
  try {
    const { score } = params;
    const scoreNum = parseInt(score, 10);

    if (isNaN(scoreNum) || scoreNum < 400 || scoreNum > 1600) {
      return NextResponse.json(
        { error: "Invalid score. Must be between 400 and 1600." },
        { status: 400 }
      );
    }

    const backendUrl = `${API_CONFIG.baseURL}/scoring/percentile/${scoreNum}`;

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
            `Backend /scoring/percentile returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Percentile GET error:", error);
    return NextResponse.json(
      {
        message: "Failed to get percentile",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

