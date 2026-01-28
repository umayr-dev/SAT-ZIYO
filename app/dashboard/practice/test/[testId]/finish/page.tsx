"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Loading } from "@/src/ui/loading";
import { practiceService, TestResults } from "@/src/services/practice.service";
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

  // Get storage key for answers
  const getStorageKey = useCallback(() => `test_answers_${attemptId}`, [attemptId]);
  
  // Get storage key for highlights
  const getHighlightsStorageKey = useCallback(() => `test_highlights_${attemptId}`, [attemptId]);

  // Get all answers from localStorage
  const getAllAnswersFromStorage = useCallback((): Map<number, { questionId: string; choiceId?: string; textAnswer?: string; markedForReview?: boolean; eliminatedChoices?: string[] }> => {
    if (typeof window === "undefined") return new Map();
    
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (!stored) return new Map();
      
      const answers = JSON.parse(stored);
      const map = new Map<number, { questionId: string; choiceId?: string; textAnswer?: string; markedForReview?: boolean; eliminatedChoices?: string[] }>();
      Object.keys(answers).forEach((key) => {
        map.set(parseInt(key), answers[key]);
      });
      return map;
    } catch (err) {
      console.error("Failed to get answers from localStorage:", err);
      return new Map();
    }
  }, [getStorageKey]);

  // Submit all pending answers from localStorage to server
  const submitAllPendingAnswers = useCallback(async () => {
    const allAnswers = getAllAnswersFromStorage();
    
    if (allAnswers.size === 0) {
      console.log("[Finish Page] No answers to submit");
      return;
    }

    console.log(`[Finish Page] Submitting ${allAnswers.size} answers to server...`);

    // Submit all answers in parallel (but with rate limiting)
    const submitPromises: Promise<void>[] = [];
    let delay = 0;

    // Convert Map to Array to avoid iterator issues
    const answersArray = Array.from(allAnswers.entries());

    for (const [questionIndex, answer] of answersArray) {
      submitPromises.push(
        (async () => {
          // Stagger requests slightly to avoid overwhelming server
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay += 50; // 50ms delay between requests

          try {
            await practiceService.submitAnswer(
              attemptId,
              answer.questionId,
              answer.choiceId,
              answer.textAnswer,
              answer.markedForReview,
              answer.eliminatedChoices
            );
          } catch (err) {
            console.error(`Failed to submit answer for question ${questionIndex}:`, err);
            // Continue submitting other answers even if one fails
          }
        })()
      );
    }

    await Promise.all(submitPromises);
    console.log("[Finish Page] All answers submitted successfully");

    // Clear localStorage after successful submission
    try {
      localStorage.removeItem(getStorageKey());
    } catch (err) {
      console.error("Failed to clear localStorage:", err);
    }
  }, [attemptId, getAllAnswersFromStorage, getStorageKey]);

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
      
      // First, submit all answers and highlights from localStorage
      await Promise.all([
        submitAllPendingAnswers(),
        submitAllHighlights(),
      ]);
      
      // Then submit the test for scoring
      const testResults = await practiceService.submitTest(attemptId);
      setResults(testResults);
      
      // Get testId from attempt
      try {
        const attempts = await practiceService.getMyAttempts();
        const attempt = attempts.find(a => a.id === attemptId);
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

  const totalScore = Math.round(
    (results.correctAnswers / results.totalQuestions) * 100
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎉 Congratulations!
          </h1>
          <p className="text-gray-600">You have completed the test</p>
        </div>

        {/* Score Summary */}
        <Card className="p-8 mb-6 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Your Score
          </h2>
          <div className="text-6xl font-bold text-blue-600 mb-2">
            {totalScore}%
          </div>
          <p className="text-gray-600">
            {results.correctAnswers} / {results.totalQuestions} correct
          </p>
        </Card>

        {/* Section Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {results.sections.map((section) => (
            <Card key={section.sectionType} className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {section.sectionType}
              </h3>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {section.score}%
              </div>
              <p className="text-sm text-gray-600 mb-4">
                out of 100%
              </p>
              <div className="space-y-2">
                {section.modules.map((module) => (
                  <div
                    key={module.moduleNumber}
                    className="text-sm text-gray-700"
                  >
                    Module {module.moduleNumber} ({module.difficulty}):{" "}
                    {module.correctCount}/{module.totalCount} correct (
                    {module.score}%)
                  </div>
                ))}
              </div>
            </Card>
          ))}
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


