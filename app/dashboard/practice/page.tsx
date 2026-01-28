// @ts-nocheck
/* eslint-disable */
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Loading } from "@/src/ui/loading";
import {
  Clock,
  FileText,
  Trophy,
  Play,
  RotateCcw,
  Filter,
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
        // Free tests - all tests are free for now, but can be filtered by test property
        filtered = filtered; // Add free test logic if needed
        break;
      case "in_progress":
        filtered = filtered.filter((test) => {
          return attempts.some(
            (a) => a.testId === test.id && a.status === "IN_PROGRESS",
          );
        });
        break;
      case "completed":
        filtered = filtered.filter((test) => {
          const testAttempts = attempts.filter((a) => a.testId === test.id);
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
      free: tests.length, // All are free for now
      in_progress: tests.filter(
        (test) =>
          attempts.find(
            (a) => a.testId === test.id && a.status === "IN_PROGRESS",
          ) !== undefined,
      ).length,
      completed: tests.filter((test) =>
        attempts
          .filter((a) => a.testId === test.id)
          .some((a) => a.status === "COMPLETED"),
      ).length,
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
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Your Practice Papers
        </h1>
        <p className="text-gray-600 text-lg">
          Hone your skills with official past papers. Consistency is key to
          success.
        </p>
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Important Note:</strong> If your test is not listed under
            the &apos;In Progress&apos; or &apos;Completed&apos; tabs, it may
            have been unpublished or permanently removed by the exam
            administrator.
          </p>
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200 mb-6">
          <p className="text-red-700">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveFilter("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeFilter === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Filter className="w-4 h-4" />
            All Papers
            <span className="ml-1 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
              {filterCounts.all}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter("new")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeFilter === "new"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Star className="w-4 h-4" />
            New Tests
            <span className="ml-1 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
              {filterCounts.new}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter("free")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeFilter === "free"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Free Tests
            <span className="ml-1 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
              {filterCounts.free}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter("in_progress")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeFilter === "in_progress"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            In Progress
            <span className="ml-1 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
              {filterCounts.in_progress}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter("completed")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeFilter === "completed"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Completed
            <span className="ml-1 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
              {filterCounts.completed}
            </span>
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="newest">Newest to Oldest</option>
            <option value="oldest">Oldest to Newest</option>
          </select>
        </div>
      </div>

      {/* Test Cards Grid */}
      {filteredAndSortedTests.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 text-lg mb-2">
            No practice tests available
          </p>
          <p className="text-gray-500 text-sm">
            Try selecting a different filter
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            return (
              <Card
                key={test.id}
                className="p-6 bg-white border border-gray-200 hover:shadow-xl transition-all duration-200 rounded-xl"
              >
                <div className="space-y-4">
                  {/* Test Title and Icon */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <FileText className="w-6 h-6 text-gray-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                        {test.title ||
                          `Paper #${filteredAndSortedTests.length - index}`}
                      </h2>
                      {test.description && (
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {test.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Test Info */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{totalDuration}m</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{totalQuestions} Q</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span className="text-xs">People took</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {totalPeopleTook}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Trophy className="w-4 h-4" />
                        <span className="text-xs">Your last score</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {bestScore !== null ? `${bestScore}%` : "Not taken"}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    {inProgressAttempt ? (
                      <Button
                        onClick={() =>
                          router.push(
                            `/dashboard/practice/test/${inProgressAttempt.id}`,
                          )
                        }
                        className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Continue
                      </Button>
                    ) : (
                      <Button
                        onClick={() =>
                          router.push(
                            `/dashboard/practice/test/${test.id}/start`,
                          )
                        }
                        className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Test
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() =>
                        router.push(
                          `/dashboard/practice/test/${test.id}/comments`,
                        )
                      }
                      className="bg-white border-gray-300 hover:bg-gray-50 rounded-lg px-3"
                      title="Discuss"
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
