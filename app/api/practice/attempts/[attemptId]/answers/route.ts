/**
 * Get Answered Questions API Route
 * GET /api/practice/attempts/:attemptId/answers
 *
 * Proxies to external API `/practice/attempts/:attemptId/answers`
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

    const backendUrl = `${API_CONFIG.baseURL}/practice/attempts/${attemptId}/answers`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Try to get error message, but don't fail if JSON parsing fails
      let errorMessage = `Backend returned ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }
      
      // If 404 or 500, return empty answers structure instead of error
      // But don't set totalQuestions to 0 - let frontend use currentModule.totalQuestions
      if (response.status === 404 || response.status === 500) {
        console.warn(`[Answers API] Backend returned ${response.status}, returning empty structure`);
        return NextResponse.json(
          {
            answers: [],
            // Don't set totalQuestions to 0 - let frontend use fallback
            answeredCount: 0,
          },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { message: errorMessage },
        { status: response.status }
      );
    }

    const raw = await response.json().catch(() => null);
    if (raw == null) {
      return NextResponse.json(
        { answers: [], answeredCount: 0 },
        { status: 200 }
      );
    }

    // Backend may return { answers: [...] } or the array directly
    const answers = Array.isArray(raw) ? raw : (raw.answers ?? []);
    const normalized = {
      answers: Array.isArray(answers) ? answers : [],
      answeredCount: Array.isArray(answers) ? answers.length : 0,
      ...(raw.totalQuestions !== undefined && { totalQuestions: raw.totalQuestions }),
    };

    return NextResponse.json(normalized, { status: 200 });
  } catch (error) {
    console.error("Practice answers GET error:", error);
    return NextResponse.json(
      {
        message: "Failed to get answered questions",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


