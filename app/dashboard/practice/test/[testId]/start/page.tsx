"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Loading } from "@/src/ui/loading";
import { practiceService, Test } from "@/src/services/practice.service";
import { Calculator, Coffee, ClipboardList, Pin } from "lucide-react";

export default function PreTestInstructionsPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [showStartModeModal, setShowStartModeModal] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");

  useEffect(() => {
    fetchTest();
  }, [testId]);

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
    setFullscreenError("");
    setShowStartModeModal(true);
  }

  function handleCloseStartModal() {
    if (starting) return;
    setFullscreenError("");
    setShowStartModeModal(false);
  }

  async function handleChooseFullscreen() {
    setFullscreenError("");
    try {
      if (document.fullscreenElement == null) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (!document.fullscreenElement) {
        setFullscreenError(
          "Fullscreen could not be turned on. Allow it in the browser, try again, or use small screen mode.",
        );
        return;
      }
      setShowStartModeModal(false);
      await actuallyStartTest();
    } catch {
      setFullscreenError(
        "Fullscreen could not be turned on. Use small screen mode or check browser permissions.",
      );
    }
  }

  async function handleChooseWindowed() {
    setFullscreenError("");
    setShowStartModeModal(false);
    await actuallyStartTest();
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

      {showStartModeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 sm:p-8 text-center space-y-5">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              How do you want to start the test?
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Fullscreen feels more like the real exam. Small screen works in a normal browser window.
            </p>
            {fullscreenError && (
              <p className="text-sm text-red-600">{fullscreenError}</p>
            )}
            <div className="space-y-2">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleChooseFullscreen}
                disabled={starting}
              >
                Use fullscreen &amp; start
              </Button>
              <Button
                variant="outline"
                className="w-full border-gray-300 text-gray-800 hover:bg-gray-50"
                onClick={handleChooseWindowed}
                disabled={starting}
              >
                Continue with small screen
              </Button>
              <Button
                variant="ghost"
                className="w-full text-gray-600"
                onClick={handleCloseStartModal}
                disabled={starting}
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

