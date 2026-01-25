"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Loading } from "@/src/ui/loading";
import { practiceService, TestResults } from "@/src/services/practice.service";
import { Trophy, CheckCircle, XCircle } from "lucide-react";

export default function FinishTestPage() {
  const router = useRouter();
  const params = useParams();
  // Route segment is [testId], value is attemptId
  const attemptId = params.testId as string;

  const [results, setResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Get storage key for answers
  const getStorageKey = useCallback(() => `test_answers_${attemptId}`, [attemptId]);

  // Get all answers from localStorage
  const getAllAnswersFromStorage = useCallback((): Map<number, { questionId: string; choiceId?: string; textAnswer?: string }> => {
    if (typeof window === "undefined") return new Map();
    
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (!stored) return new Map();
      
      const answers = JSON.parse(stored);
      const map = new Map<number, { questionId: string; choiceId?: string; textAnswer?: string }>();
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
            if (answer.choiceId) {
              await practiceService.submitAnswer(
                attemptId,
                answer.questionId,
                answer.choiceId
              );
            } else if (answer.textAnswer) {
              await practiceService.submitAnswer(
                attemptId,
                answer.questionId,
                undefined,
                answer.textAnswer
              );
            }
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

  const submitTest = useCallback(async () => {
    try {
      setSubmitting(true);
      
      // First, submit all answers from localStorage
      await submitAllPendingAnswers();
      
      // Then submit the test for scoring
      const testResults = await practiceService.submitTest(attemptId);
      setResults(testResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit test");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  }, [attemptId, submitAllPendingAnswers]);

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
        <div className="flex gap-4 justify-center">
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
      </div>
    </div>
  );
}


