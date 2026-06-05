"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { practiceService } from "@/src/services/practice.service";
import { submitAnswersInBatches } from "@/src/utils/submit-answers-batch";
import {
  getModuleAnswersForSubmit,
  removePracticeAnswersByPrefix,
} from "@/src/utils/practice-answers-storage";
import {
  isBreakStep,
  isContinueTestStep,
  isFinishTestStep,
  nextStepFromFinishModule,
} from "@/src/utils/practice-module-flow";
import { Flag } from "lucide-react";

interface LocalAnswer {
  questionId: string;
  choiceId?: string;
  textAnswer?: string;
  markedForReview?: boolean;
  eliminatedChoices?: string[];
}

async function syncModuleAnswers(
  attemptId: string,
  modulePrefix: string,
): Promise<{
  total: number;
  processed: number;
  failed: number;
  skipped: number;
}> {
  const answers = getModuleAnswersForSubmit(attemptId, modulePrefix);
  if (answers.length === 0) {
    return { total: 0, processed: 0, failed: 0, skipped: 0 };
  }

  let result = await submitAnswersInBatches(attemptId, answers, {
    throwIfAllFailed: false,
    toleratePersistedErrors: true,
  });

  if (result.failed > 0 && result.processed === 0 && result.skipped === 0) {
    result = await submitAnswersInBatches(attemptId, answers, {
      batchSize: 1,
      throwIfAllFailed: false,
      toleratePersistedErrors: true,
    });
  }

  return result;
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
    [totalParam],
  );

  const [answeredSet, setAnsweredSet] = useState<Set<number>>(new Set());
  const [flaggedSet, setFlaggedSet] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStorageKey = useCallback(
    () => `test_answers_${attemptId}`,
    [attemptId],
  );

  const modulePrefix = useMemo(() => {
    const sectionIndex =
      section != null ? Math.max(0, parseInt(String(section), 10) - 1) : 0;
    const m = moduleParam != null ? String(moduleParam) : "1";
    return `s${sectionIndex}_m${m}_`;
  }, [section, moduleParam]);

  const refreshAnsweredFromStorage = useCallback(() => {
    if (!totalQuestions || typeof window === "undefined") {
      setAnsweredSet(new Set());
      setFlaggedSet(new Set());
      return;
    }

    try {
      const stored = localStorage.getItem(getStorageKey());
      if (!stored) {
        setAnsweredSet(new Set());
        setFlaggedSet(new Set());
        return;
      }
      const answers = JSON.parse(stored) as Record<string, LocalAnswer>;
      const answered = new Set<number>();
      const flagged = new Set<number>();
      Object.entries(answers).forEach(([key, ans]) => {
        if (!key.startsWith(modulePrefix)) return;
        const idx = parseInt(key.slice(modulePrefix.length), 10);
        if (Number.isNaN(idx) || idx < 0 || idx >= totalQuestions) return;
        const hasAnswer =
          !!ans.choiceId ||
          (ans.textAnswer !== undefined && String(ans.textAnswer).trim() !== "");
        if (hasAnswer) answered.add(idx);
        if (ans.markedForReview) flagged.add(idx);
      });
      setAnsweredSet(answered);
      setFlaggedSet(flagged);
    } catch (e) {
      console.error(
        "[ModuleReview] Failed to read answers from localStorage:",
        e,
      );
      setAnsweredSet(new Set());
      setFlaggedSet(new Set());
    }
  }, [getStorageKey, totalQuestions, modulePrefix]);

  useEffect(() => {
    refreshAnsweredFromStorage();
    setLoading(false);
  }, [refreshAnsweredFromStorage]);

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

      const syncResult = await syncModuleAnswers(attemptId, modulePrefix);

      if (
        syncResult.total > 0 &&
        syncResult.failed > 0 &&
        syncResult.processed === 0 &&
        syncResult.skipped === 0
      ) {
        setError(
          `Failed to save ${syncResult.failed} answer(s) to the server. Check your connection and try again.`,
        );
        return;
      }

      if (syncResult.processed > 0 || syncResult.skipped > 0) {
        removePracticeAnswersByPrefix(attemptId, modulePrefix);
      }

      const result = await practiceService.finishModule(attemptId);
      const step = nextStepFromFinishModule(result);

      if (typeof window !== "undefined") {
        sessionStorage.setItem(`test_force_refresh_state_${attemptId}`, "1");
        sessionStorage.setItem(
          `test_module_transition_retries_${attemptId}`,
          "0",
        );
      }

      if (isBreakStep(step)) {
        router.push(`/dashboard/practice/test/${attemptId}/break`);
        return;
      }
      if (isContinueTestStep(step)) {
        router.push(`/dashboard/practice/test/${attemptId}`);
        return;
      }
      if (isFinishTestStep(step)) {
        router.push(`/dashboard/practice/test/${attemptId}/finish`);
        return;
      }
      router.push(`/dashboard/practice/test/${attemptId}`);
    } catch (err) {
      console.error("[ModuleReview] Continue failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to continue to next module. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600 text-sm">Loading module review...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="container mx-auto px-4 max-w-5xl">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 border border-orange-200 bg-orange-50">
            <p className="text-xs uppercase tracking-wide text-orange-700 font-semibold mb-1">
              Answered
            </p>
            <p className="text-2xl font-bold text-orange-900">
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
                "relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg border text-xs sm:text-sm flex items-center justify-center cursor-pointer transition-all";
              if (isAnswered && isFlagged) {
                cls += " bg-orange-500 border-black text-white";
              } else if (isAnswered) {
                cls += " bg-orange-500 border-orange-500 text-white";
              } else if (isFlagged) {
                cls += " bg-white border-orange-400 text-gray-800 ring-2 ring-orange-400";
              } else {
                cls += " bg-white border-gray-300 text-gray-800";
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
                  {isFlagged && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border border-black bg-orange-400 flex items-center justify-center">
                      <Flag className="w-2.5 h-2.5 text-black" />
                    </div>
                  )}
                  {i + 1}
                </button>
              );
            })}
          </div>
        </Card>

        {error && (
          <div className="mb-4 text-center space-y-3">
            <p className="text-sm text-red-600">{error}</p>
            <Button
              variant="outline"
              onClick={() => {
                refreshAnsweredFromStorage();
                void handleContinue();
              }}
              disabled={submitting}
            >
              Try again
            </Button>
          </div>
        )}

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
