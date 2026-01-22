"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    submitTest();
  }, [attemptId]);

  async function submitTest() {
    try {
      setSubmitting(true);
      const testResults = await practiceService.submitTest(attemptId);
      setResults(testResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit test");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  }

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


