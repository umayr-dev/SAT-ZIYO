/**
 * Math Formulas API Route
 * GET /api/reference/math-formulas
 *
 * Proxies to external API for math formulas
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let backendUrl = `${API_CONFIG.baseURL}/reference/math-formulas`;
    if (category) {
      backendUrl += `/${category}`;
    }

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
            `Backend /reference/math-formulas returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Math Formulas GET error:", error);
    return NextResponse.json(
      {
        message: "Failed to get math formulas",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

