"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Loading } from "@/src/ui/loading";
import {
  practiceService,
  Test,
  Attempt,
} from "@/src/services/practice.service";
import { Clock, FileText, Trophy, Play, RotateCcw } from "lucide-react";

export default function PracticePage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");
      const [testsData, attemptsData] = await Promise.all([
        practiceService.getAvailableTests(),
        practiceService.getMyAttempts(),
      ]);
      
      console.log("[Practice Page] Raw tests data:", testsData);
      console.log("[Practice Page] Tests count:", testsData?.length || 0);
      
      // Filter only active tests (backend should already filter, but double-check on frontend)
      // Also handle cases where isActive might be undefined (default to true)
      const activeTests = (testsData || []).filter((test) => {
        // If isActive is explicitly false, exclude it
        // If isActive is undefined/null, include it (default to active)
        return test.isActive !== false;
      });
      
      console.log("[Practice Page] Active tests count:", activeTests.length);
      console.log("[Practice Page] Active tests:", activeTests);
      
      setTests(activeTests);
      setAttempts(attemptsData || []);
    } catch (err) {
      console.error("[Practice Page] Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load tests");
    } finally {
      setLoading(false);
    }
  }

  function getTestAttempts(testId: string): Attempt[] {
    return attempts.filter((a) => a.testId === testId);
  }

  function getInProgressAttempt(testId: string): Attempt | undefined {
    return attempts.find(
      (a) => a.testId === testId && a.status === "IN_PROGRESS"
    );
  }

  function getBestScore(testId: string): number | null {
    const testAttempts = getTestAttempts(testId)
      .filter((a) => a.status === "COMPLETED" && a.totalScore !== undefined)
      .map((a) => a.totalScore!);
    return testAttempts.length > 0 ? Math.max(...testAttempts) : null;
  }

  function calculateTotalDuration(test: Test): number {
    if (!test.sections || !Array.isArray(test.sections)) {
      return test.totalDuration || 0;
    }
    return test.sections.reduce(
      (total, section) => total + (section.duration || 0),
      0
    ) || test.totalDuration || 0;
  }

  function calculateTotalQuestions(test: Test): number {
    if (!test.sections || !Array.isArray(test.sections)) {
      return test.totalQuestions || 0;
    }
    return test.sections.reduce(
      (total, section) => {
        if (!section.modules || !Array.isArray(section.modules)) {
          return total;
        }
        return (
          total +
          section.modules.reduce(
            (moduleTotal, module) =>
              moduleTotal + (module.questionCount || 0),
            0
          )
        );
      },
      0
    ) || test.totalQuestions || 0;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          SAT Practice Tests
        </h1>
        <p className="text-gray-600">
          Choose a practice test to begin or continue
        </p>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200 mb-6">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {tests.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">No practice tests available</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => {
            const inProgressAttempt = getInProgressAttempt(test.id);
            const bestScore = getBestScore(test.id);
            const totalDuration = calculateTotalDuration(test);
            const totalQuestions = calculateTotalQuestions(test);

            return (
              <Card key={test.id} className="p-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {test.title}
                    </h2>
                    {test.description && (
                      <p className="text-gray-600">{test.description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{totalDuration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{totalQuestions} questions</span>
                    </div>
                    {bestScore !== null && (
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span>Your best: {bestScore}%</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {inProgressAttempt ? (
                      <>
                        <Button
                          onClick={() =>
                            router.push(
                              `/dashboard/practice/test/${inProgressAttempt.id}`
                            )
                          }
                          className="flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Continue Test
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            router.push(
                              `/dashboard/practice/test/${test.id}/start`
                            )
                          }
                        >
                          Start New Attempt
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() =>
                          router.push(`/dashboard/practice/test/${test.id}/start`)
                        }
                        className="flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Start Test
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

