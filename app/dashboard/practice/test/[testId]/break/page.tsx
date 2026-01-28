"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Loading } from "@/src/ui/loading";
import { practiceService, BreakStatusResponse } from "@/src/services/practice.service";
import { Clock, Coffee } from "lucide-react";

export default function BreakPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.testId as string;

  const [breakStatus, setBreakStatus] = useState<BreakStatusResponse | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load break status
  useEffect(() => {
    checkBreakStatus();
  }, [attemptId]);

  // Update timer locally
  useEffect(() => {
    if (breakStatus?.breakEndsAt) {
      const endTime = new Date(breakStatus.breakEndsAt).getTime();
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setRemainingSeconds(remaining);

        if (remaining === 0 && breakStatus.nextStep === "NEW_SECTION") {
          router.push(`/dashboard/practice/test/${attemptId}`);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [breakStatus, attemptId, router]);

  async function checkBreakStatus() {
    try {
      const status = await practiceService.checkBreakStatus(attemptId);
      setBreakStatus(status);

      if (status.nextStep === "NEW_SECTION") {
        router.push(`/dashboard/practice/test/${attemptId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check break status");
    } finally {
      setLoading(false);
    }
  }

  async function handleContinueTest() {
    try {
      // Navigate to test - break will be handled by backend
      router.push(`/dashboard/practice/test/${attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to continue test");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !breakStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-6 text-center">
          <p className="text-red-700 mb-4">{error || "Break status not found"}</p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/practice")}
          >
            Back to Tests
          </Button>
        </Card>
      </div>
    );
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 text-center">
        <div className="mb-8">
          <Coffee className="w-16 h-16 mx-auto text-orange-500 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Break Time</h1>
          <p className="text-gray-600">
            You have completed the Reading & Writing section!
          </p>
        </div>

        <div className="mb-8">
          <p className="text-lg text-gray-700 mb-4">
            Take a 10-minute break before Math.
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-sm border border-gray-200">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-mono font-semibold text-gray-900">
              {formatted}
            </span>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Your next section will start automatically when the timer reaches 0
          </p>
        </div>

        <div className="space-y-3 mb-6 text-left">
          <h2 className="text-lg font-semibold text-gray-900">
            During your break:
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Stand up and stretch your legs</li>
            <li>Have a light snack or drink water</li>
            <li>Use the restroom if needed</li>
            <li>Avoid using your phone or doing test-related work</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/practice")}
          >
            Exit to Dashboard
          </Button>
          <Button onClick={handleContinueTest}>
            Continue Test Early
          </Button>
        </div>
      </Card>
    </div>
  );
}
