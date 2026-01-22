/**
 * Get Current Question API Route
 * GET /api/practice/attempts/:attemptId/current
 *
 * Proxies to external API `/practice/attempts/:attemptId/current`
 * using JWT from HttpOnly cookie (`token`)
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

    const backendUrl = `${API_CONFIG.baseURL}/practice/attempts/${attemptId}/current`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    let data: any = {};
    try {
      data = await response.json();
    } catch (parseError) {
      // If JSON parsing fails, try to get text response
      const text = await response.text().catch(() => "");
      console.error("[Current Question] Failed to parse JSON:", text);
      data = { error: text || "Invalid response from backend" };
    }

    if (!response.ok) {
      console.error(`[Current Question] Backend error ${response.status}:`, data);
      return NextResponse.json(
        {
          message:
            data.message ||
            data.error ||
            `Backend /practice/attempts/current returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    // Validate response structure
    // If question is missing, it might mean the test is completed or in break
    // Check if there's a nextStep or breakStatus that indicates the state
    if (!data.question) {
      console.warn("[Current Question] Response missing question field:", {
        attemptId,
        hasNextStep: !!data.nextStep,
        hasBreakStatus: !!data.breakStatus,
        hasCurrentModule: !!data.currentModule,
        fullResponse: data,
      });

      // If test is in break or completed, return a structured response
      if (data.nextStep === "BREAK" || data.breakStatus === "IN_PROGRESS") {
        return NextResponse.json(
          {
            ...data,
            message: "Test is currently in break period",
            requiresBreak: true,
          },
          { status: 200 }
        );
      }

      if (data.nextStep === "SUBMIT_TEST" || data.nextStep === "COMPLETE") {
        return NextResponse.json(
          {
            ...data,
            message: "Test is completed",
            requiresFinish: true,
          },
          { status: 200 }
        );
      }

      // If we can't determine the state, return error but with more context
      return NextResponse.json(
        {
          message: "Backend response missing question field",
          error: "Invalid response structure",
          debug: {
            hasNextStep: !!data.nextStep,
            nextStep: data.nextStep,
            hasBreakStatus: !!data.breakStatus,
            breakStatus: data.breakStatus,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Practice current question GET error:", error);
    return NextResponse.json(
      {
        message: "Failed to get current question",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


