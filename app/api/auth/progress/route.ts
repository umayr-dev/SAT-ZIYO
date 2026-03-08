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
  testId?: string;
  test_id?: string;
  testTitle?: string;
  status: string;
  totalScore?: number;
  total_score?: number;
  startedAt?: string;
  started_at?: string;
  completedAt?: string;
  completed_at?: string;
}

interface ResultsFromApi {
  totalScore?: number;
  total_score?: number;
  totalQuestions?: number;
  total_questions?: number;
  correctAnswers?: number;
  correct_answers?: number;
  wrongAnswers?: number;
  wrong_answers?: number;
  completedAt?: string;
  completed_at?: string;
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
      const hasProgress =
        data != null &&
        (data.lastScore != null ||
          (typeof data.testsCompleted === "number" && data.testsCompleted > 0) ||
          data.accuracy != null);
      if (hasProgress) {
        return NextResponse.json(
          {
            lastScore: data.lastScore ?? null,
            testsCompleted: data.testsCompleted ?? 0,
            accuracy: data.accuracy ?? null,
            previousAccuracy: data.previousAccuracy ?? null,
            questionsPracticed: data.questionsPracticed ?? 0,
          },
          { status: 200 },
        );
      }
    }

    // 2) Derive from practice: my-attempts + latest attempt results
    let attemptsRes = await fetch(
      `${API_CONFIG.baseURL}/practice/my-attempts`,
      { method: "GET", headers },
    );
    if (!attemptsRes.ok && request.nextUrl?.origin) {
      const origin = request.nextUrl.origin;
      if (origin.startsWith("http")) {
        attemptsRes = await fetch(`${origin}/api/practice/my-attempts`, {
          method: "GET",
          headers: { Cookie: request.headers.get("cookie") ?? "" },
        });
      }
    }

    if (!attemptsRes.ok) {
      return NextResponse.json(
        {
          lastScore: null,
          testsCompleted: 0,
          accuracy: null,
          previousAccuracy: null,
          questionsPracticed: 0,
        },
        { status: 200 },
      );
    }

    const rawAttempts = await attemptsRes.json().catch(() => ({}));
    const attemptsList: AttemptFromApi[] = Array.isArray(rawAttempts)
      ? rawAttempts
      : Array.isArray(rawAttempts?.data)
        ? rawAttempts.data
        : Array.isArray(rawAttempts?.attempts)
          ? rawAttempts.attempts
          : Array.isArray(rawAttempts?.items)
            ? rawAttempts.items
            : [];

    const completedStatuses = new Set([
      "COMPLETED",
      "completed",
      "Completed",
      "SUBMITTED",
      "submitted",
      "DONE",
      "done",
    ]);
    const norm = (a: AttemptFromApi) => ({
      ...a,
      status: (a.status || "").toString().trim(),
      completedAt: a.completedAt ?? a.completed_at,
      totalScore: a.totalScore ?? a.total_score,
    });
    const completed = attemptsList
      .map(norm)
      .filter((a) => completedStatuses.has(a.status));
    const sorted = [...completed].sort((a, b) => {
      const rawA = a.completedAt ?? a.startedAt ?? a.started_at;
      const rawB = b.completedAt ?? b.startedAt ?? b.started_at;
      const dateA = rawA ? new Date(rawA).getTime() : 0;
      const dateB = rawB ? new Date(rawB).getTime() : 0;
      return dateB - dateA;
    });

    const testsCompleted = sorted.length;
    const latestAttempt = sorted[0];
    const previousAttempt = sorted[1];
    let lastScore: number | null =
      latestAttempt?.totalScore != null ? latestAttempt.totalScore : null;
    let accuracy: number | null = null;
    let previousAccuracy: number | null = null;
    let questionsPracticed = 0;

    async function getAccuracyForAttempt(attemptId: string): Promise<{ accuracy: number; total: number; score: number | null } | null> {
      const res = await fetch(
        `${API_CONFIG.baseURL}/practice/attempts/${attemptId}/results`,
        { method: "GET", headers },
      );
      if (!res.ok) return null;
      const raw = await res.json().catch(() => ({}));
      const total = raw.totalQuestions ?? raw.total_questions ?? 0;
      const correct = raw.correctAnswers ?? raw.correct_answers ?? 0;
      const score = raw.totalScore ?? raw.total_score ?? null;
      if (total > 0) {
        return { accuracy: Math.round((correct / total) * 100), total, score };
      }
      return null;
    }

    if (latestAttempt?.id) {
      const latestResults = await getAccuracyForAttempt(latestAttempt.id);
      if (latestResults) {
        accuracy = latestResults.accuracy;
        questionsPracticed = latestResults.total;
        if (lastScore == null && latestResults.score != null) lastScore = latestResults.score;
      }
    }
    if (previousAttempt?.id) {
      const prevResults = await getAccuracyForAttempt(previousAttempt.id);
      if (prevResults) previousAccuracy = prevResults.accuracy;
    }

    return NextResponse.json(
      {
        lastScore,
        testsCompleted,
        accuracy,
        previousAccuracy,
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
        previousAccuracy: null,
        questionsPracticed: 0,
      },
      { status: 200 },
    );
  }
}
