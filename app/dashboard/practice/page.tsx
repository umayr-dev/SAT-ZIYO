"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Loading } from "@/src/ui/loading";
import {
  Clock,
  Play,
  RotateCcw,
  MessageCircle,
  Trophy,
  BookOpen,
  CheckCircle2,
  Timer,
} from "lucide-react";
import { usePracticeOverview } from "@/src/components/practice/usePracticeOverview";
import type { Attempt, Test } from "@/src/services/practice.service";
import { practiceService } from "@/src/services/practice.service";

type Tab = "all" | "in_progress" | "completed";

export default function PracticePage() {
  const router = useRouter();
  const { data, isLoading, error } = usePracticeOverview();

  const tests = useMemo(() => data?.tests ?? [], [data?.tests]);

  // Ignore ABANDONED attempts everywhere
  const attempts = useMemo(
    () => (data?.attempts ?? []).filter((a) => a.status !== "ABANDONED"),
    [data?.attempts],
  );

  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [startingId, setStartingId] = useState<string | null>(null);

  // ---- Helpers ----

  function getInProgressAttempt(testId: string): Attempt | undefined {
    return attempts.find(
      (a) => a.testId === testId && a.status === "IN_PROGRESS",
    );
  }

  function getBestCompletedAttempt(testId: string): Attempt | undefined {
    const completed = attempts.filter(
      (a) =>
        a.testId === testId &&
        a.status === "COMPLETED" &&
        a.totalScore != null,
    );
    if (!completed.length) return undefined;
    return completed.reduce((best, a) =>
      (a.totalScore ?? 0) > (best.totalScore ?? 0) ? a : best,
    );
  }

  function roundScore(score: number, min: number): number {
    return Math.max(min, Math.round(Number(score) / 10) * 10);
  }

  function calculateTotalDuration(test: Test): number {
    if (!test.sections?.length) return test.totalDuration ?? 0;
    return (
      test.sections.reduce((sum, s) => sum + (s.duration ?? 0), 0) ||
      test.totalDuration ||
      0
    );
  }

  function calculateTotalQuestions(test: Test): number {
    if (!test.sections?.length) return test.totalQuestions ?? 0;
    let total = 0;
    for (const section of test.sections) {
      if (!section.modules?.length) continue;
      for (const mod of section.modules) total += mod.questionCount ?? 0;
    }
    return total || test.totalQuestions || 0;
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  async function handleContinue(testId: string) {
    if (startingId) return;
    try {
      setStartingId(testId);
      const response = await practiceService.startTest(testId);
      router.push(`/dashboard/practice/test/${response.attemptId}`);
    } catch (err) {
      console.error("Failed to resume test:", err);
      setStartingId(null);
    }
  }

  // ---- Derived section data ----

  const inProgressAttempts = useMemo(
    () => attempts.filter((a) => a.status === "IN_PROGRESS"),
    [attempts],
  );

  const completedAttempts = useMemo(
    () =>
      attempts
        .filter((a) => a.status === "COMPLETED")
        .sort(
          (a, b) =>
            new Date(b.completedAt ?? "").getTime() -
            new Date(a.completedAt ?? "").getTime(),
        ),
    [attempts],
  );

  // ---- Tabs config ----

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    {
      id: "all",
      label: "All Tests",
      icon: <BookOpen className="w-4 h-4" />,
      count: tests.length,
    },
    {
      id: "in_progress",
      label: "In Progress",
      icon: <Timer className="w-4 h-4" />,
      count: inProgressAttempts.length,
    },
    {
      id: "completed",
      label: "Completed",
      icon: <CheckCircle2 className="w-4 h-4" />,
      count: completedAttempts.length,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-black mb-1">
          Practice Tests
        </h1>
        <p className="text-sm text-black">
          Official SAT-style full-length tests. Pick up where you left off or
          start fresh.
        </p>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200 mb-6">
          <p className="text-red-700 text-sm">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </Card>
      )}

      {/* Tab bar: active = blue bg + white text; inactive = gray border + gray text */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border-2 border-gray-400 hover:bg-gray-50 hover:border-gray-500"
              }`}
            >
              {tab.icon}
              {tab.label}
              <span
                className={`ml-0.5 text-xs rounded-full px-1.5 py-0.5 font-semibold ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Tab: All Tests ── */}
      {activeTab === "all" && (
        <>
          {tests.length === 0 ? (
            <Card className="p-12 text-center border border-dashed border-brand-blue/30">
              <p className="text-brand-blue/60">No practice tests available</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tests.map((test, index) => {
                const inProgress = getInProgressAttempt(test.id);
                const bestAttempt = getBestCompletedAttempt(test.id);
                const totalDuration = calculateTotalDuration(test);
                const totalQuestions = calculateTotalQuestions(test);
                const isStarting = startingId === test.id;

                const accessType = (
                  (test as { accessType?: string }).accessType ?? "FREE"
                ) as "FREE" | "PREMIUM";
                const accessLabel = accessType === "PREMIUM" ? "Premium" : "Free";
                const accessClasses =
                  accessType === "PREMIUM"
                    ? "bg-brand-orange-light text-brand-orange border border-brand-orange/30"
                    : "bg-brand-blue-50 text-brand-blue border border-brand-blue/30";

                const statusBadge = inProgress
                  ? { label: "In Progress", color: "bg-brand-orange/20 text-brand-orange border border-brand-orange/40" }
                  : bestAttempt
                    ? { label: "Completed", color: "bg-brand-orange-light text-brand-orange border border-brand-orange/30" }
                    : { label: "Not Started", color: "bg-gray-100 text-gray-500" };

                const title = test.title || `Test #${tests.length - index}`;

                return (
                  <Card
                    key={test.id}
                    className="p-4 bg-white border-2 border-orange-500 hover:border-orange-600 hover:shadow-lg transition-all duration-200 rounded-2xl"
                  >
                    <div className="space-y-3">
                      {/* Thumbnail – soft orange with centered logo over white band */}
                      <div className="relative overflow-hidden rounded-2xl h-40 bg-gradient-to-r from-orange-100 via-orange-200 to-orange-100">
                        <div className="absolute inset-y-0 left-1/5 right-1/5 bg-white/70" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-40">
                          <div className="relative w-36 h-36 sm:w-40 sm:h-40">
                            <Image
                              src="/logo.png"
                              alt="SAT Ziyo"
                              fill
                              className="object-contain"
                              sizes="160px"
                              priority
                            />
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-base font-semibold text-white drop-shadow-lg text-center px-4">
                            {title}
                          </span>
                        </div>
                      </div>

                      {/* Meta row – black text and borders */}
                      <div className="flex items-center justify-between text-[11px] text-black">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{totalDuration} min</span>
                          </div>
                          <span className="h-1 w-1 rounded-full bg-black" />
                          <span>{totalQuestions} q</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusBadge.label === "In Progress" ? "bg-blue-100 text-blue-800 border-blue-300" : "bg-gray-100 text-black border-black"}`}
                        >
                          {statusBadge.label}
                        </span>
                      </div>

                      {/* Access + score – black text and borders */}
                      <div className="flex items-center justify-between text-[11px] text-black">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium border border-black ${accessType === "PREMIUM" ? "bg-gray-100" : "bg-gray-100"}`}
                        >
                          {accessLabel}
                        </span>
                        {bestAttempt?.totalScore != null ? (
                          <span>
                            Best:{" "}
                            <span className="font-semibold text-black">
                              {roundScore(bestAttempt.totalScore, 400)}
                            </span>
                          </span>
                        ) : inProgress ? (
                          <span className="text-black">In progress</span>
                        ) : (
                          <span className="text-gray-500">Not taken</span>
                        )}
                      </div>

                      {/* Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        {inProgress ? (
                          <Button
                            onClick={() => handleContinue(inProgress.testId)}
                            disabled={!!startingId}
                            className="flex-1 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl py-2 text-sm font-semibold"
                          >
                            {isStarting ? (
                              <Loading size="sm" />
                            ) : (
                              <>
                                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                Continue
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            onClick={() =>
                              router.push(
                                `/dashboard/practice/test/${test.id}/start`,
                              )
                            }
                            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-2 text-sm font-semibold"
                          >
                            {bestAttempt ? (
                              <>
                                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                Retake
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 mr-1.5" />
                                Start Test
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            router.push(
                              `/dashboard/practice/test/${test.id}/comments`,
                            )
                          }
                          className="bg-white border-black hover:bg-gray-50 rounded-xl px-3 py-2 text-black"
                          title="Discussion"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Tab: In Progress ── */}
      {activeTab === "in_progress" && (
        <>
          {inProgressAttempts.length === 0 ? (
            <Card className="p-12 text-center border border-dashed border-brand-orange/30">
              <Timer className="w-10 h-10 text-brand-orange/40 mx-auto mb-3" />
              <p className="text-brand-orange/70 font-medium">No tests in progress</p>
              <p className="text-sm text-brand-orange/50 mt-1">
                Start a test from the All Tests tab to see it here.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inProgressAttempts.map((attempt) => {
                const isStarting = startingId === attempt.testId;
                const test = tests.find((t) => t.id === attempt.testId);
                const totalDuration = test ? calculateTotalDuration(test) : 0;
                const totalQuestions = test ? calculateTotalQuestions(test) : 0;
                const title = attempt.testTitle || "Practice Test";
                return (
                  <Card
                    key={attempt.id}
                    className="p-4 bg-white border-2 border-orange-500 hover:border-orange-600 hover:shadow-lg transition-all duration-200 rounded-2xl"
                  >
                    <div className="space-y-3">
                      {/* Thumbnail – soft orange with centered logo over white band */}
                      <div className="relative overflow-hidden rounded-2xl h-40 bg-gradient-to-r from-orange-100 via-orange-200 to-orange-100">
                        <div className="absolute inset-y-0 left-1/5 right-1/5 bg-white/70" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-40">
                          <div className="relative w-36 h-36 sm:w-40 sm:h-40">
                            <Image
                              src="/logo.png"
                              alt="SAT Ziyo"
                              fill
                              className="object-contain"
                              sizes="160px"
                            />
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-base font-semibold text-white drop-shadow-lg text-center px-4">
                            {title}
                          </span>
                        </div>
                      </div>

                      {/* Meta row – black text and borders */}
                      <div className="flex items-center justify-between text-[11px] text-black">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{totalDuration} min</span>
                          </div>
                          <span className="h-1 w-1 rounded-full bg-black" />
                          <span>{totalQuestions} q</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-blue-300 bg-blue-100 text-blue-800">
                          In Progress
                        </span>
                      </div>

                      <p className="text-xs text-black">
                        Started {formatDate(attempt.startedAt)}
                      </p>

                      {/* Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          onClick={() => handleContinue(attempt.testId)}
                          disabled={!!startingId}
                          className="flex-1 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl py-2 text-sm font-semibold"
                        >
                          {isStarting ? (
                            <Loading size="sm" />
                          ) : (
                            <>
                              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                              Continue
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            router.push(
                              `/dashboard/practice/test/${attempt.testId}/comments`,
                            )
                          }
                          className="bg-white border-black hover:bg-gray-50 rounded-xl px-3 py-2 text-black"
                          title="Discussion"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Completed ── */}
      {activeTab === "completed" && (
        <>
          {completedAttempts.length === 0 ? (
            <Card className="p-12 text-center border border-dashed border-brand-orange/30">
              <Trophy className="w-10 h-10 text-brand-orange/40 mx-auto mb-3" />
              <p className="text-brand-orange/70 font-medium">No completed tests yet</p>
              <p className="text-sm text-brand-orange/50 mt-1">
                Finish a test to see your scores here.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedAttempts.map((attempt) => {
                const total =
                  attempt.totalScore != null
                    ? roundScore(attempt.totalScore, 400)
                    : null;
                const rw =
                  attempt.readingWritingScore != null
                    ? roundScore(attempt.readingWritingScore, 200)
                    : null;
                const math =
                  attempt.mathScore != null
                    ? roundScore(attempt.mathScore, 200)
                    : null;
                const title = attempt.testTitle || "Practice Test";

                return (
                  <Card
                    key={attempt.id}
                    className="p-4 bg-white border-2 border-orange-500 hover:border-orange-600 hover:shadow-lg transition-all duration-200 rounded-2xl"
                  >
                    <div className="space-y-3">
                      {/* Thumbnail – soft orange with centered logo over white band */}
                      <div className="relative overflow-hidden rounded-2xl h-40 bg-gradient-to-r from-orange-100 via-orange-200 to-orange-100">
                        <div className="absolute inset-y-0 left-1/5 right-1/5 bg-white/70" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-40">
                          <div className="relative w-36 h-36 sm:w-40 sm:h-40">
                            <Image
                              src="/logo.png"
                              alt="SAT Ziyo"
                              fill
                              className="object-contain"
                              sizes="160px"
                            />
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-base font-semibold text-white drop-shadow-lg text-center px-4">
                            {title}
                          </span>
                        </div>
                      </div>

                      {/* Meta row – black text and borders */}
                      <div className="flex items-center justify-between text-[11px] text-black">
                        <div className="flex items-center gap-2">
                          {attempt.completedAt && (
                            <span>{formatDate(attempt.completedAt)}</span>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-black border border-black">
                          Completed
                        </span>
                      </div>

                      {/* Scores – black text and border */}
                      <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-black text-black">
                        {total != null ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-black">
                              {total}
                            </span>
                            <span className="text-xs text-black/80">/1600</span>
                          </div>
                        ) : (
                          <span className="text-sm text-black/70">Score unavailable</span>
                        )}
                        {(rw != null || math != null) && (
                          <div className="flex items-center gap-3 text-xs text-black">
                            {rw != null && (
                              <span>
                                R&amp;W{" "}
                                <span className="font-semibold text-black">
                                  {rw}
                                </span>
                              </span>
                            )}
                            {math != null && (
                              <span>
                                Math{" "}
                                <span className="font-semibold text-black">
                                  {math}
                                </span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="outline"
                          onClick={() =>
                            router.push(
                              `/dashboard/practice/test/${attempt.id}/finish`,
                            )
                          }
                          className="flex-1 border-black text-black hover:bg-gray-100 rounded-xl py-2 text-sm font-semibold"
                        >
                          View Results
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            router.push(
                              `/dashboard/practice/test/${attempt.testId}/comments`,
                            )
                          }
                          className="bg-white border-black hover:bg-gray-50 rounded-xl px-3 py-2 text-black"
                          title="Discussion"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
