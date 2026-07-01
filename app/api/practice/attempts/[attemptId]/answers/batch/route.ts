/**
 * Batch Answer Submission API Route
 * POST /api/practice/attempts/:attemptId/answers/batch
 * 
 * Production-ready batch submission endpoint
 * Submits multiple answers in a single request to reduce server load
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";
import { toBackendAnswerPayload } from "@/src/utils/practice-backend-answer";
import type { BackendAnswerPayload } from "@/src/utils/practice-backend-answer";
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
  { params }: { params: Promise<{ attemptId: string }> | { attemptId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const resolvedParams = await Promise.resolve(params);
    const { attemptId } = resolvedParams;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { answers: rawAnswers } = body;

    if (!Array.isArray(rawAnswers) || rawAnswers.length === 0) {
      return NextResponse.json(
        { message: "Invalid request: answers must be a non-empty array" },
        { status: 400 }
      );
    }

    const answers = rawAnswers.map(toBackendAnswerPayload);
    // Limit batch size to prevent abuse
    const MAX_BATCH_SIZE = 30;
    if (answers.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { message: `Batch size exceeds maximum of ${MAX_BATCH_SIZE}` },
        { status: 400 }
      );
    }

    // Submit answers to backend
    // If backend supports batch endpoint, use it; otherwise submit individually
    const backendUrl = `${API_CONFIG.baseURL}/practice/attempts/${attemptId}/answers/batch`;
    
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      // Try batch endpoint first
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const payload: Record<string, unknown> = {
          success: data.success ?? true,
          processed: data.processed || 0,
          failed: data.failed || 0,
        };
        // Only forward ID lists when the backend actually returned them.
        // Defaulting to [] made the client think nothing was saved and re-submit all answers.
        if (Array.isArray(data.savedQuestionIds)) {
          payload.savedQuestionIds = data.savedQuestionIds;
        }
        if (Array.isArray(data.failedQuestionIds)) {
          payload.failedQuestionIds = data.failedQuestionIds;
        }
        return NextResponse.json(payload, { status: 200 });
      } else if (response.status === 404) {
        // Batch endpoint not available, fallback to individual submissions
        console.log("[Batch API] Batch endpoint not available, using individual submissions");
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Backend returned ${response.status}`);
      }
    } catch (batchError) {
      // Fallback: submit individually
      console.log("[Batch API] Falling back to individual submissions");
    }

    // Fallback: Submit answers individually (but in smaller batches to avoid rate limiting)
    const INDIVIDUAL_BATCH_SIZE = 5;
    for (let i = 0; i < answers.length; i += INDIVIDUAL_BATCH_SIZE) {
      const batch = answers.slice(i, i + INDIVIDUAL_BATCH_SIZE);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (answer: BackendAnswerPayload) => {
          const response = await fetch(
            `${API_CONFIG.baseURL}/practice/attempts/${attemptId}/answer`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(answer),
            }
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Backend returned ${response.status}`);
          }

          return response.json();
        })
      );

      batchResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          processed++;
        } else {
          failed++;
          errors.push(`Answer ${i + index + 1}: ${result.reason?.message || "Unknown error"}`);
        }
      });

      // Small delay between batches to avoid rate limiting
      if (i + INDIVIDUAL_BATCH_SIZE < answers.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return NextResponse.json({
      success: failed === 0,
      processed,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    }, { status: 200 });
  } catch (error) {
    console.error("Batch answer submission error:", error);
    return NextResponse.json(
      {
        message: "Failed to submit answers",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

