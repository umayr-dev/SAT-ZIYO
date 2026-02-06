"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { practiceService } from "@/src/services/practice.service";

interface LocalAnswer {
  questionId: string;
  choiceId?: string;
  textAnswer?: string;
  markedForReview?: boolean;
  eliminatedChoices?: string[];
}

export default function ModuleReviewPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const attemptId = params.testId as string;

  const section = searchParams.get("section");
  const moduleParam = searchParams.get("module");
  const type = searchParams.get("type") as "ENGLISH" | "MATH" | null;
  const totalParam = searchParams.get("total");
  const totalQuestions = useMemo(
    () => (totalParam ? parseInt(totalParam, 10) || 0 : 0),
    [totalParam]
  );

  const [answeredSet, setAnsweredSet] = useState<Set<number>>(new Set());
  const [flaggedSet, setFlaggedSet] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStorageKey = useCallback(
    () => `test_answers_${attemptId}`,
    [attemptId]
  );

  useEffect(() => {
    if (!totalQuestions || typeof window === "undefined") {
      setLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(getStorageKey());
      if (!stored) {
        setAnsweredSet(new Set());
        setFlaggedSet(new Set());
        setLoading(false);
        return;
      }
      const answers = JSON.parse(stored) as Record<string, LocalAnswer>;
      const answered = new Set<number>();
      const flagged = new Set<number>();
      Object.entries(answers).forEach(([key, ans]) => {
        const idx = parseInt(key, 10);
        if (Number.isNaN(idx) || idx < 0 || idx >= totalQuestions) return;
        const hasAnswer =
          !!ans.choiceId ||
          (ans.textAnswer !== undefined && ans.textAnswer.trim() !== "");
        if (hasAnswer) answered.add(idx);
        if (ans.markedForReview) flagged.add(idx);
      });
      setAnsweredSet(answered);
      setFlaggedSet(flagged);
    } catch (e) {
      console.error(
        "[ModuleReview] Failed to read answers from localStorage:",
        e
      );
      setAnsweredSet(new Set());
      setFlaggedSet(new Set());
    } finally {
      setLoading(false);
    }
  }, [getStorageKey, totalQuestions]);

  const answeredCount = answeredSet.size;
  const flaggedCount = flaggedSet.size;
  const unansweredCount =
    totalQuestions > 0 ? totalQuestions - answeredSet.size : 0;

  const handleQuestionClick = (index: number) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`test_jump_${attemptId}`, index.toString());
    }
    router.push(`/dashboard/practice/test/${attemptId}`);
  };

  const handleContinue = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Batch submit all answers from localStorage (kam so'rov)
      let answersArray: LocalAnswer[] = [];
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(getStorageKey());
          if (stored) {
            const answers = JSON.parse(stored) as Record<string, LocalAnswer>;
            answersArray = Object.values(answers);
          }
        } catch (e) {
          console.error("[ModuleReview] Failed to parse answers:", e);
        }
      }

      if (answersArray.length > 0) {
        await practiceService.submitAnswersBatch(
          attemptId,
          answersArray.map((a) => ({
            questionId: a.questionId,
            choiceId: a.choiceId,
            textAnswer: a.textAnswer,
            markedForReview: a.markedForReview,
            eliminatedChoices: a.eliminatedChoices,
          }))
        );
      }

      const result = await practiceService.finishModule(attemptId);

      switch (result.nextStep) {
        case "BREAK":
          router.push(`/dashboard/practice/test/${attemptId}/break`);
          break;
        case "MODULE_2":
        case "NEW_SECTION":
          router.push(`/dashboard/practice/test/${attemptId}`);
          break;
        case "SUBMIT_TEST":
        case "COMPLETE":
        default:
          router.push(`/dashboard/practice/test/${attemptId}/finish`);
          break;
      }
    } catch (err) {
      console.error("[ModuleReview] Continue failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to continue to next module. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600 text-sm">Loading module review...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Module Complete! 🎉
          </h1>
          <p className="text-gray-600">
            Section {section || "?"}, Module {moduleParam || "?"}
            {type
              ? ` · ${type === "ENGLISH" ? "Reading & Writing" : "Math"}`
              : ""}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Review your answers before moving to the next section.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 border border-green-200 bg-green-50">
            <p className="text-xs uppercase tracking-wide text-green-700 font-semibold mb-1">
              Answered
            </p>
            <p className="text-2xl font-bold text-green-900">
              {answeredCount}/{totalQuestions}
            </p>
          </Card>
          <Card className="p-4 border border-yellow-200 bg-yellow-50">
            <p className="text-xs uppercase tracking-wide text-yellow-700 font-semibold mb-1">
              Flagged for Review
            </p>
            <p className="text-2xl font-bold text-yellow-900">{flaggedCount}</p>
          </Card>
          <Card className="p-4 border border-gray-200 bg-white">
            <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-1">
              Unanswered
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {unansweredCount}
            </p>
          </Card>
        </div>

        {/* Question grid */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Question Navigator
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Click any question to return and change your answer.
          </p>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-11 gap-2">
            {Array.from({ length: totalQuestions }, (_, i) => {
              const isAnswered = answeredSet.has(i);
              const isFlagged = flaggedSet.has(i);

              let cls =
                "w-9 h-9 sm:w-10 sm:h-10 rounded-lg border text-xs sm:text-sm flex items-center justify-center cursor-pointer transition-all";
              if (isAnswered) {
                cls += " bg-blue-500 border-blue-500 text-white";
              } else {
                cls += " bg-white border-gray-300 text-gray-800";
              }
              if (isFlagged) {
                cls += " ring-2 ring-yellow-400";
              }

              return (
                <button
                  key={i}
                  type="button"
                  className={cls}
                  onClick={() => handleQuestionClick(i)}
                  title={`Question ${i + 1}${
                    isAnswered ? " (answered)" : " (unanswered)"
                  }${isFlagged ? " • flagged" : ""}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </Card>

        {error && (
          <p className="text-sm text-red-600 mb-4 text-center">{error}</p>
        )}

        {/* Continue button */}
        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={submitting}
            className="px-6 py-2 rounded-full"
          >
            {submitting ? "Continuing..." : "Continue to Next Module"}
          </Button>
        </div>
      </div>
    </div>
  );
}
