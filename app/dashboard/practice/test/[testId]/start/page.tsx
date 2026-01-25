"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Loading } from "@/src/ui/loading";
import { practiceService, Test } from "@/src/services/practice.service";
import { Clock, FileText, Calculator, Coffee, ClipboardList, Pin } from "lucide-react";

export default function PreTestInstructionsPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  const [countdown, setCountdown] = useState(10);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchTest();
  }, [testId]);

  useEffect(() => {
    // Cleanup countdown on unmount
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [countdownInterval]);

  async function fetchTest() {
    try {
      const tests = await practiceService.getAvailableTests();
      const foundTest = tests.find((t) => t.id === testId);
      if (foundTest) {
        setTest(foundTest);
      } else {
        setError("Test not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load test");
    } finally {
      setLoading(false);
    }
  }

  async function actuallyStartTest() {
    try {
      setStarting(true);
      const response = await practiceService.startTest(testId);
      router.push(`/dashboard/practice/test/${response.attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start test");
      setStarting(false);
    }
  }

  function handleBeginClick() {
    // First open fullscreen prompt modal with 10s countdown
    setFullscreenError("");
    setCountdown(10);
    setShowFullscreenPrompt(true);

    // Start countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // If fullscreen not enabled, cancel and redirect
          if (!document.fullscreenElement) {
            setShowFullscreenPrompt(false);
            router.push("/dashboard/practice");
            return 0;
        }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setCountdownInterval(interval);
  }

  async function handleEnterFullscreen() {
    setFullscreenError("");
    try {
      // Clear countdown
      if (countdownInterval) {
        clearInterval(countdownInterval);
        setCountdownInterval(null);
      }

      // Try to enter fullscreen
      if (document.fullscreenElement == null) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }

      // Wait a bit for fullscreen to activate
      await new Promise((resolve) => setTimeout(resolve, 100));

      // If fullscreen still not active, do NOT start the test
      if (!document.fullscreenElement) {
        setFullscreenError(
          "Please allow fullscreen in your browser to start the test."
        );
        // Restart countdown
        setCountdown(10);
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              if (!document.fullscreenElement) {
                setShowFullscreenPrompt(false);
                router.push("/dashboard/practice");
                return 0;
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setCountdownInterval(interval);
        return;
      }

      // Fullscreen is active, start the test
      await actuallyStartTest();
      setShowFullscreenPrompt(false);
    } catch {
      setFullscreenError(
        "Fullscreen mode is required to start this test. Please enable it and try again."
      );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <p className="text-red-700">{error || "Test not found"}</p>
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

  const englishSection = test.sections.find((s) => s.sectionType === "ENGLISH");
  const mathSection = test.sections.find((s) => s.sectionType === "MATH");
  const totalDuration = test.sections.reduce(
    (sum, s) => sum + s.duration,
    0
  );
  const totalQuestions = test.sections.reduce(
    (sum, s) =>
      sum + s.modules.reduce((mSum, m) => mSum + m.questionCount, 0),
    0
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{test.title}</h1>
        {test.description && (
          <p className="text-lg text-gray-600">{test.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Test Overview Card */}
        <Card className="p-6 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Test Overview
            </h2>
          </div>
          <div className="space-y-5">
            <p className="text-gray-700 text-sm">
              This test consists of two sections:
            </p>

            {englishSection && (
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-full"></div>
                <div className="pl-5">
                  <h3 className="font-semibold text-gray-900 mb-2 text-base">
                    Reading and Writing ({englishSection.duration} minutes)
                  </h3>
                  <ul className="space-y-1.5 text-sm text-gray-700">
                    {englishSection.modules.map((module, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>
                          Module {module.moduleNumber}: {module.questionCount}{" "}
                          questions, {module.duration} minutes
                          {module.moduleNumber === 2 && " (adaptive)"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {mathSection && (
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-full"></div>
                <div className="pl-5">
                  <h3 className="font-semibold text-gray-900 mb-2 text-base">
                    Math ({mathSection.duration} minutes)
                  </h3>
                  <ul className="space-y-1.5 text-sm text-gray-700">
                    {mathSection.modules.map((module, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>
                          Module {module.moduleNumber}: {module.questionCount}{" "}
                          questions, {module.duration} minutes
                          {module.moduleNumber === 2 && " (adaptive)"}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {mathSection.allowCalculator && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                      <Calculator className="w-4 h-4 text-green-600" />
                      <span>Calculator allowed (Desmos provided)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-700 pt-2 border-t border-gray-100">
              <Coffee className="w-4 h-4 text-amber-600" />
              <span>10-minute break between sections</span>
            </div>
          </div>
        </Card>

        {/* Important Notes Card */}
        <Card className="p-6 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <Pin className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Important Notes:
            </h2>
          </div>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-orange-500 mt-0.5 font-bold">•</span>
              <span>
                You can navigate between questions within a module
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-500 mt-0.5 font-bold">•</span>
              <span>
                Once you finish a module, you cannot go back
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-500 mt-0.5 font-bold">•</span>
              <span>Your progress is saved automatically</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-500 mt-0.5 font-bold">•</span>
              <span>
                No penalty for wrong answers - answer every question!
              </span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/practice")}
          disabled={starting}
          className="px-6"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleBeginClick} 
          disabled={starting}
          className="px-8 bg-gray-900 hover:bg-gray-800"
        >
          {starting ? "Starting..." : "Begin Test"}
        </Button>
      </div>

      {showFullscreenPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-orange-500 text-white flex items-center justify-center text-2xl font-bold">
              {countdown > 0 ? countdown : "⚠"}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Fullscreen Required
              </h2>
              <p className="text-sm text-gray-600 mb-2">
                You must enable fullscreen mode to start the test.
              </p>
              {countdown > 0 && (
                <p className="text-lg font-semibold text-orange-600 mb-2">
                  {countdown} seconds remaining
                </p>
              )}
              {countdown === 0 && (
                <p className="text-sm font-semibold text-red-600 mb-2">
                  Test cancelled. Redirecting...
                </p>
              )}
              {fullscreenError && (
                <p className="mt-3 text-sm text-red-600">{fullscreenError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleEnterFullscreen}
                disabled={starting || countdown === 0}
              >
                Enter Fullscreen &amp; Start
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (countdownInterval) {
                    clearInterval(countdownInterval);
                  }
                  setShowFullscreenPrompt(false);
                  router.push("/dashboard/practice");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

