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

    // PERF: the SAT math reference sheet is immutable content. Without this
    // every math module entered paid a full browser -> Vercel(Stockholm) ->
    // VPS -> Postgres round trip to re-fetch identical rows.
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 },
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

    // Let the browser reuse this too — students open the reference sheet
    // repeatedly within a math module.
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
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

