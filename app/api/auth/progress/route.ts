/**
 * Progress API Route
 * GET /api/auth/progress
 * Returns user progress: lastScore, testsCompleted, accuracy
 * Tries backend GET /auth/progress first; if not available, derives from practice/my-attempts and attempt results.
 */

import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

function getTokenFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get("token")?.value;
  if (token) return token;
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return null;
}

interface AttemptFromApi {
  id: string;
  testId: string;
  testTitle?: string;
  status: string;
  totalScore?: number;
  startedAt: string;
  completedAt?: string;
}

interface ResultsFromApi {
  totalScore: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers?: number;
  completedAt?: string;
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // 1) Try backend GET /auth/progress (if backend supports it)
    const progressRes = await fetch(`${API_CONFIG.baseURL}/auth/progress`, {
      method: "GET",
      headers,
    });

    if (progressRes.ok) {
      const data = await progressRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: 200 });
    }

    // 2) Derive from practice: my-attempts + latest attempt results
    const attemptsRes = await fetch(
      `${API_CONFIG.baseURL}/practice/my-attempts`,
      { method: "GET", headers },
    );

    if (!attemptsRes.ok) {
      return NextResponse.json(
        {
          lastScore: null,
          testsCompleted: 0,
          accuracy: null,
          questionsPracticed: 0,
        },
        { status: 200 },
      );
    }

    const attempts: AttemptFromApi[] = await attemptsRes.json().catch(() => []);
    const completed = Array.isArray(attempts)
      ? attempts.filter((a) => a.status === "COMPLETED")
      : [];
    const sorted = [...completed].sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return dateB - dateA;
    });

    const testsCompleted = sorted.length;
    const latestAttempt = sorted[0];
    let lastScore: number | null =
      latestAttempt?.totalScore != null ? latestAttempt.totalScore : null;
    let accuracy: number | null = null;
    let questionsPracticed = 0;

    if (latestAttempt?.id) {
      const resultsRes = await fetch(
        `${API_CONFIG.baseURL}/practice/attempts/${latestAttempt.id}/results`,
        { method: "GET", headers },
      );
      if (resultsRes.ok) {
        const results: ResultsFromApi = await resultsRes
          .json()
          .catch(() => ({}));
        const total = results.totalQuestions ?? 0;
        const correct = results.correctAnswers ?? 0;
        if (total > 0) {
          accuracy = Math.round((correct / total) * 100);
        }
        questionsPracticed = total;
        if (lastScore == null && results.totalScore != null) {
          lastScore = results.totalScore;
        }
      }
    }

    return NextResponse.json(
      {
        lastScore,
        testsCompleted,
        accuracy,
        questionsPracticed,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Progress API] Error:", error);
    return NextResponse.json(
      {
        lastScore: null,
        testsCompleted: 0,
        accuracy: null,
        questionsPracticed: 0,
      },
      { status: 200 },
    );
  }
}
