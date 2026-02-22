// @ts-nocheck
/* eslint-disable */
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Loading } from "@/src/ui/loading";
import {
  Clock,
  FileText,
  Trophy,
  Play,
  RotateCcw,
  Star,
  BookOpen,
  RefreshCw,
  CheckCircle2,
  Users,
  MessageCircle,
} from "lucide-react";
import { usePracticeOverview } from "@/src/components/practice/usePracticeOverview";
import type { Attempt, Test } from "@/src/services/practice.service";
import { practiceService } from "@/src/services/practice.service";

type FilterType = "all" | "new" | "free" | "in_progress" | "completed";

export default function PracticePage() {
  const router = useRouter();
  const { data, isLoading, error } = usePracticeOverview();
  const tests = useMemo(() => data?.tests ?? [], [data?.tests]);
  const attempts = useMemo(() => data?.attempts ?? [], [data?.attempts]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  function getTestAttempts(testId: string): Attempt[] {
    return attempts.filter((a) => a.testId === testId);
  }

  function getInProgressAttempt(testId: string): Attempt | undefined {
    return attempts.find(
      (a) => a.testId === testId && a.status === "IN_PROGRESS",
    );
  }

  function getBestScore(testId: string): number | null {
    const testAttempts = getTestAttempts(testId)
      .filter((a) => a.status === "COMPLETED" && a.totalScore !== undefined)
      .map((a) => a.totalScore!);
    return testAttempts.length > 0 ? Math.max(...testAttempts) : null;
  }

  // SAT total score: display in steps of 10, minimum 400 (backend may return raw e.g. 402)
  function formatSatTotalScore(score: number): number {
    return Math.max(400, Math.round(Number(score) / 10) * 10);
  }

  function calculateTotalDuration(test: Test): number {
    if (!test.sections || !Array.isArray(test.sections)) {
      return test.totalDuration || 0;
    }
    return (
      test.sections.reduce<number>(
        (total, section) => total + (section.duration || 0),
        0,
      ) ||
      test.totalDuration ||
      0
    );
  }

  function calculateTotalQuestions(test: Test): number {
    if (!test.sections || !Array.isArray(test.sections)) {
      return test.totalQuestions || 0;
    }

    let total = 0;

    for (const section of test.sections) {
      if (!section.modules || !Array.isArray(section.modules)) {
        continue;
      }

      for (const module of section.modules) {
        total += module.questionCount || 0;
      }
    }

    return total || test.totalQuestions || 0;
  }

  // Filter and sort tests
  const filteredAndSortedTests = useMemo(() => {
    let filtered = [...tests];

    // Apply filters
    switch (activeFilter) {
      case "new":
        // New tests - tests with no attempts or recent attempts
        filtered = filtered.filter((test) => {
          const testAttempts = attempts.filter((a) => a.testId === test.id);
          return testAttempts.length === 0;
        });
        break;
      case "free":
        // Free tests - default to FREE when accessType is not PREMIUM
        filtered = filtered.filter((test) => {
          const accessType = (test as any).accessType as
            | "FREE"
            | "PREMIUM"
            | undefined;
          return accessType !== "PREMIUM";
        });
        break;
      case "in_progress":
        filtered = filtered.filter((test) => {
          const testAttempts = attempts.filter((a) => a.testId === test.id);
          const hasInProgress = testAttempts.some(
            (a) => a.status === "IN_PROGRESS",
          );
          const hasCompleted = testAttempts.some(
            (a) => a.status === "COMPLETED",
          );
          // In progress = bor, lekin hali to'liq yakunlanmagan
          return hasInProgress && !hasCompleted;
        });
        break;
      case "completed":
        filtered = filtered.filter((test) => {
          const testAttempts = attempts.filter((a) => a.testId === test.id);
          // Completed = kamida bitta COMPLETED attempt bor
          return testAttempts.some((a) => a.status === "COMPLETED");
        });
        break;
      case "all":
      default:
        break;
    }

    // Sort tests
    if (sortBy === "newest") {
      filtered.sort((a, b) => {
        // Sort by creation date or ID (newest first)
        return (b.id || "").localeCompare(a.id || "");
      });
    } else {
      filtered.sort((a, b) => {
        return (a.id || "").localeCompare(b.id || "");
      });
    }

    return filtered;
  }, [tests, attempts, activeFilter, sortBy]);

  // Count tests by filter
  const filterCounts = useMemo(() => {
    return {
      all: tests.length,
      new: tests.filter(
        (test) => attempts.filter((a) => a.testId === test.id).length === 0,
      ).length,
      free: tests.filter((test) => {
        const accessType = (test as any).accessType as
          | "FREE"
          | "PREMIUM"
          | undefined;
        return accessType !== "PREMIUM";
      }).length,
      in_progress: tests.filter((test) => {
        const testAttempts = attempts.filter((a) => a.testId === test.id);
        const hasInProgress = testAttempts.some(
          (a) => a.status === "IN_PROGRESS",
        );
        const hasCompleted = testAttempts.some(
          (a) => a.status === "COMPLETED",
        );
        return hasInProgress && !hasCompleted;
      }).length,
      completed: tests.filter((test) => {
        const testAttempts = attempts.filter((a) => a.testId === test.id);
        return testAttempts.some((a) => a.status === "COMPLETED");
      }).length,
    };
  }, [tests, attempts]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-blue mb-2">
          Official Practice Tests
        </h1>
        <p className="text-sm md:text-base text-brand-blue/80">
          Real SAT-style tests from your dashboard. Jump back into your latest
          attempt in one click.
        </p>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200 mb-6">
          <p className="text-red-700">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </Card>
      )}

      {/* Test Cards Grid */}
      {filteredAndSortedTests.length === 0 ? (
        <Card className="p-12 text-center border border-dashed border-brand-blue/30 bg-brand-blue-50/60">
          <p className="text-brand-blue text-base mb-2">
            No practice tests available
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAndSortedTests.map((test, index) => {
            const inProgressAttempt = getInProgressAttempt(test.id);
            const bestScore = getBestScore(test.id);
            const totalDuration = calculateTotalDuration(test);
            const totalQuestions = calculateTotalQuestions(test);
            const testAttempts = getTestAttempts(test.id);
            const completedAttempts = testAttempts.filter(
              (a) => a.status === "COMPLETED",
            );
            const peopleTook = completedAttempts.length;
            const allAttemptsForTest = attempts.filter(
              (a) => a.testId === test.id,
            );
            const totalPeopleTook = allAttemptsForTest.length;

            const statusBadge = inProgressAttempt
              ? { label: "In progress", color: "bg-brand-blue-50 text-brand-blue" }
              : completedAttempts.length > 0
              ? { label: "Completed", color: "bg-brand-orange-light text-brand-orange" }
              : { label: "Unsolved", color: "bg-brand-blue-light text-brand-blue" };

            const hasAttempts = totalPeopleTook > 0;
            const title =
              test.title ||
              `Test #${filteredAndSortedTests.length - index}`;

            const accessType = ((test as any).accessType ??
              "FREE") as "FREE" | "PREMIUM";
            const accessLabel =
              accessType === "PREMIUM" ? "Premium" : "Free";
            const accessClasses =
              accessType === "PREMIUM"
                ? "bg-brand-orange-light text-brand-orange border border-brand-orange/30"
                : "bg-brand-blue-50 text-brand-blue border border-brand-blue/30";

            return (
              <Card
                key={test.id}
                className="p-4 md:p-5 bg-white border border-brand-blue-light hover:border-brand-blue/40 hover:shadow-md transition-all duration-200 rounded-2xl"
              >
                <div className="space-y-3">
                  {/* Top: tile with logo + glass effect, test name centered */}
                  <div className="relative overflow-hidden rounded-2xl h-44 md:h-52 bg-gradient-to-br from-brand-orange-light via-brand-orange/20 to-brand-blue">
                    {/* Logo: larger so more visible */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-40">
                      <div className="relative w-44 h-44 md:w-56 md:h-56">
                        <Image
                          src="/logo.png"
                          alt="SAT Ziyo"
                          fill
                          className="object-contain"
                          sizes="224px"
                          priority
                        />
                      </div>
                    </div>
                    {/* Glass effect overlays */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute -top-10 left-0 w-40 h-32 bg-brand-orange/50 rounded-full blur-3xl" />
                      <div className="absolute bottom-0 right-[-40px] w-48 h-32 bg-brand-blue/60 rounded-full blur-3xl" />
                    </div>
                    {/* Test name centered */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg md:text-xl font-semibold text-white drop-shadow-md text-center px-4">
                        {title}
                      </span>
                    </div>
                  </div>

                  {/* Middle: meta + attempts */}
                  <div className="flex items-center justify-between text-[11px] md:text-xs text-brand-blue/80">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{totalDuration} min</span>
                      </div>
                      <span className="h-1 w-1 rounded-full bg-brand-blue/40" />
                      <span>{totalQuestions} questions</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${statusBadge.color}`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>
                  <div className="text-[11px] md:text-xs text-brand-blue/70 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${accessClasses}`}
                    >
                      {accessLabel}
                    </span>
                    <span>
                      {hasAttempts ? (
                        bestScore !== null ? (
                          <>Best score: {formatSatTotalScore(bestScore)} · {totalPeopleTook} attempts</>
                        ) : (
                          <>{totalPeopleTook} attempts so far</>
                        )
                      ) : (
                        <>No attempts yet</>
                      )}
                    </span>
                  </div>

                  {/* Bottom: primary action + comments */}
                  <div className="pt-1 md:pt-2 flex items-center gap-2">
                    <Button
                      onClick={() =>
                        router.push(
                          inProgressAttempt
                            ? `/dashboard/practice/test/${inProgressAttempt.id}`
                            : `/dashboard/practice/test/${test.id}/start`,
                        )
                      }
                      className="flex-1 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl py-2.5 text-sm font-semibold"
                    >
                      {inProgressAttempt ? (
                        <>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Continue test
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start test
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        router.push(
                          `/dashboard/practice/test/${test.id}/comments`,
                        )
                      }
                      className="bg-white border-brand-blue-light hover:bg-brand-orange-light rounded-xl px-3 py-2"
                      title="Comments / Discussion"
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
    </div>
  );
}
