/**
 * Submit Answer API Route
 * POST /api/practice/attempts/:attemptId/answer
 *
 * Proxies to external API `/practice/attempts/:attemptId/answer`
 * using JWT from HttpOnly cookie (`token`)
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";
import { toBackendAnswerPayload } from "@/src/utils/practice-backend-answer";

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

    // Backend only accepts questionId / choiceId / textAnswer.
    // Flag & elimination state stay in localStorage until the API supports them.
    const backendBody = toBackendAnswerPayload(body);

    const backendUrl = `${API_CONFIG.baseURL}/practice/attempts/${attemptId}/answer`;

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendBody),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            data.message ||
            data.error ||
            `Backend /practice/attempts/answer returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    // Only return answer acknowledgment; do not forward result/score from answer API.
    // Final score must be fetched from GET /api/practice/attempts/:attemptId/results
    const { result, score, results, ...answerAck } = data as Record<string, unknown>;
    return NextResponse.json(answerAck, { status: 200 });
  } catch (error) {
    console.error("Practice answer POST error:", error);
    return NextResponse.json(
      {
        message: "Failed to submit answer",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


