"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Loading } from "@/src/ui/loading";
import { practiceService, TestResults } from "@/src/services/practice.service";
import { ApiClientError } from "@/src/lib/api-client";
import { CommentsSection } from "@/src/components/comments/CommentsSection";
import { TestAnalytics } from "@/src/components/practice/TestAnalytics";
import { Trophy, CheckCircle, XCircle } from "lucide-react";

export default function FinishTestPage() {
  const router = useRouter();
  const params = useParams();
  // Route segment is [testId], value is attemptId
  const attemptId = params.testId as string;

  const [results, setResults] = useState<TestResults | null>(null);
  const [testId, setTestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Get storage key for answers (same as test page: test_answers_attemptId, keys inside s0_m1_0 etc.)
  const getStorageKey = useCallback(() => `test_answers_${attemptId}`, [attemptId]);

  // Get storage key for highlights
  const getHighlightsStorageKey = useCallback(() => `test_highlights_${attemptId}`, [attemptId]);

  // Get all answers from all modules for submit (keys s{section}_m{module}_{index})
  const getAllAnswersForSubmit = useCallback((): Array<{
    questionId: string;
    choiceId?: string;
    textAnswer?: string;
    markedForReview?: boolean;
    eliminatedChoices?: string[];
  }> => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (!stored) return [];
      const answers = JSON.parse(stored) as Record<string, Record<string, unknown>>;
      return Object.keys(answers)
        .filter((k) => /^s\d+_m\d+_\d+$/.test(k))
        .filter((k) => {
          const entry = answers[k] as { choiceId?: string; textAnswer?: string };
          return !!(
            entry?.choiceId ||
            (entry?.textAnswer != null && String(entry.textAnswer).trim() !== "")
          );
        })
        .map((k) => answers[k] as {
          questionId: string;
          choiceId?: string;
          textAnswer?: string;
          markedForReview?: boolean;
          eliminatedChoices?: string[];
        });
    } catch (err) {
      console.error("Failed to get answers from localStorage:", err);
      return [];
    }
  }, [getStorageKey]);

  // Submit all pending answers from localStorage (all modules) to server
  const submitAllPendingAnswers = useCallback(async () => {
    const allAnswers = getAllAnswersForSubmit();

    if (allAnswers.length === 0) {
      console.log("[Finish Page] No answers to submit");
      return;
    }

    console.log(`[Finish Page] Submitting ${allAnswers.length} answers to server...`);

    const BATCH_SIZE = 10;
    for (let i = 0; i < allAnswers.length; i += BATCH_SIZE) {
      const batch = allAnswers.slice(i, i + BATCH_SIZE);
      try {
        await practiceService.submitAnswersBatch(attemptId, batch.map((a) => ({
          questionId: a.questionId,
          choiceId: a.choiceId,
          textAnswer: a.textAnswer,
          markedForReview: a.markedForReview,
          eliminatedChoices: a.eliminatedChoices,
        })));
      } catch (err) {
        for (const answer of batch) {
          try {
            await practiceService.submitAnswer(
              attemptId,
              answer.questionId,
              answer.choiceId,
              answer.textAnswer,
              answer.markedForReview,
              answer.eliminatedChoices
            );
          } catch {
            // continue
          }
        }
      }
      if (i + BATCH_SIZE < allAnswers.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    console.log("[Finish Page] All answers submitted successfully");

    try {
      localStorage.removeItem(getStorageKey());
    } catch (err) {
      console.error("Failed to clear localStorage:", err);
    }
  }, [attemptId, getAllAnswersForSubmit, getStorageKey]);

  // Submit all highlights from localStorage
  const submitAllHighlights = useCallback(async () => {
    if (typeof window === "undefined") return;
    
    try {
      const stored = localStorage.getItem(getHighlightsStorageKey());
      if (!stored) {
        console.log("[Finish Page] No highlights to submit");
        return;
      }
      
      const highlights = JSON.parse(stored);
      const highlightsArray = Object.entries(highlights) as Array<[string, Array<{
        startOffset: number;
        endOffset: number;
        color: "YELLOW" | "GREEN" | "BLUE" | "PINK" | "ORANGE";
        note?: string | null;
      }>]>;
      
      if (highlightsArray.length === 0) {
        console.log("[Finish Page] No highlights to submit");
        return;
      }

      console.log(`[Finish Page] Submitting ${highlightsArray.length} question highlights to server...`);

      const submitPromises: Promise<void>[] = [];
      let delay = 0;

      for (const [questionId, highlightList] of highlightsArray) {
        if (highlightList.length === 0) continue;
        
        submitPromises.push(
          (async () => {
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay += 50;

            try {
              await practiceService.saveHighlights(attemptId, questionId, highlightList);
            } catch (err) {
              console.error(`Failed to submit highlights for question ${questionId}:`, err);
            }
          })()
        );
      }

      await Promise.all(submitPromises);
      console.log("[Finish Page] All highlights submitted successfully");

      // Clear highlights from localStorage after successful submission
      try {
        localStorage.removeItem(getHighlightsStorageKey());
      } catch (err) {
        console.error("Failed to clear highlights from localStorage:", err);
      }
    } catch (err) {
      console.error("Failed to submit highlights:", err);
    }
  }, [attemptId, getHighlightsStorageKey]);

  const submitTest = useCallback(async () => {
    try {
      setSubmitting(true);
      setError("");

      // First, submit all answers and highlights from localStorage
      await Promise.all([
        submitAllPendingAnswers(),
        submitAllHighlights(),
      ]);

      // Then submit the test for scoring
      try {
        const testResults = await practiceService.submitTest(attemptId);
        setResults(testResults);
      } catch (submitErr) {
        // Backend may return "This attempt is not in progress" if already submitted (e.g. refresh, double submit, timer ended)
        const isNotInProgress =
          submitErr instanceof ApiClientError &&
          submitErr.status === 400 &&
          /not in progress/i.test(submitErr.message ?? "");
        if (isNotInProgress) {
          const testResults = await practiceService.getResults(attemptId);
          setResults(testResults);
        } else {
          throw submitErr;
        }
      }

      // Get testId from attempt
      try {
        const attempts = await practiceService.getMyAttempts();
        const attempt = attempts.find((a) => a.id === attemptId);
        if (attempt) {
          setTestId(attempt.testId);
        }
      } catch (err) {
        console.error("Failed to get testId from attempt:", err);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit test");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  }, [attemptId, submitAllPendingAnswers, submitAllHighlights]);

  useEffect(() => {
    submitTest();
  }, [submitTest]);

  if (loading || submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loading size="lg" />
          <p className="mt-4 text-gray-600">
            {submitting ? "Submitting your test..." : "Loading results..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <p className="text-red-700">{error || "Failed to load results"}</p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/practice")}
            className="mt-4"
          >
            Back to Tests
          </Button>
        </Card>
      </div>
    );
  }

  const totalQuestionsDisplay = (() => {
    if (!results.sections?.length) return results.totalQuestions ?? 0;
    let total = 0;
    for (const section of results.sections) {
      for (const mod of section.modules ?? []) {
        total +=
          section.sectionType === "MATH"
            ? Math.min(mod.totalCount ?? 22, 22)
            : (mod.totalCount ?? 0);
      }
    }
    return total > 0 ? total : (results.totalQuestions ?? 0);
  })();
  const percentageCorrect =
    totalQuestionsDisplay > 0
      ? Math.round(
          (results.correctAnswers / totalQuestionsDisplay) * 100
        )
      : 0;
  const englishSection = results.sections.find(
    (s) => s.sectionType === "ENGLISH"
  );
  const mathSection = results.sections.find(
    (s) => s.sectionType === "MATH"
  );

  // SAT scores from results: readingWritingScore/mathScore (200–800) or sections[].scaledScore; steps of 10, min 200/400
  const roundToTens = (n: number) => Math.round(Number(n) / 10) * 10;
  const sectionScore = (s: number) => Math.max(200, roundToTens(s));
  const totalScoreDisplay = Math.max(
    400,
    roundToTens(results.totalScore ?? 0)
  );
  const englishScoreDisplay =
    results.readingWritingScore != null
      ? sectionScore(results.readingWritingScore)
      : englishSection?.scaledScore != null
        ? sectionScore(englishSection.scaledScore)
        : englishSection?.score != null
          ? sectionScore(englishSection.score)
          : null;
  const mathScoreDisplay =
    results.mathScore != null
      ? sectionScore(results.mathScore)
      : mathSection?.scaledScore != null
        ? sectionScore(mathSection.scaledScore)
        : mathSection?.score != null
          ? sectionScore(mathSection.score)
          : null;

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎉 Congratulations!
          </h1>
          <p className="text-gray-600">You have completed the test</p>
        </div>

        {/* Overall Score (SAT total 400–1600, steps of 10, min 400) */}
        <Card className="p-8 mb-6 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Overall Score
          </h2>
          <div className="text-6xl font-bold text-blue-600 mb-2">
            {totalScoreDisplay}
          </div>
          <p className="text-gray-500 text-sm mb-1">out of 1600</p>
          <p className="text-gray-600">
            {results.correctAnswers} / {totalQuestionsDisplay} correct
            {totalQuestionsDisplay > 0 && (
              <span className="ml-2">({percentageCorrect}%)</span>
            )}
          </p>
        </Card>

        {/* English & Math section scores (200–800 each) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Reading & Writing
            </h3>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {englishScoreDisplay ?? "—"}
            </div>
            <p className="text-sm text-gray-500 mb-4">out of 800</p>
            {englishSection?.modules?.length ? (
              <div className="space-y-2">
                {englishSection.modules.map((module) => (
                  <div
                    key={module.moduleNumber}
                    className="text-sm text-gray-700"
                  >
                    Module {module.moduleNumber} ({module.difficulty}):{" "}
                    {module.correctCount}/{module.totalCount} correct
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Math
            </h3>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {mathScoreDisplay ?? "—"}
            </div>
            <p className="text-sm text-gray-500 mb-4">out of 800</p>
            {mathSection?.modules?.length ? (
              <div className="space-y-2">
                {mathSection.modules.map((module) => {
                  const totalCap = Math.min(module.totalCount ?? 22, 22);
                  return (
                    <div
                      key={module.moduleNumber}
                      className="text-sm text-gray-700"
                    >
                      Module {module.moduleNumber} ({module.difficulty}):{" "}
                      {module.correctCount}/{totalCap} correct
                    </div>
                  );
                })}
              </div>
            ) : null}
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center mb-8">
          <Button
            onClick={() =>
              router.push(`/dashboard/practice/test/${attemptId}/review`)
            }
            className="flex items-center gap-2"
          >
            Review All Questions
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/practice")}
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Test Analytics */}
        {testId && (
          <div className="mb-8">
            <TestAnalytics testId={testId} />
          </div>
        )}

        {/* Comments Section */}
        {testId && (
          <div className="mb-8">
            <CommentsSection testId={testId} />
          </div>
        )}
      </div>
    </div>
  );
}


