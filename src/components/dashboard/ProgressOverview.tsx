"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  ChevronDown,
  Award,
  ClipboardCheck,
  Percent,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import Link from "next/link";
import { authService } from "@/src/services/auth.service";

interface ExamDate {
  id: string;
  date: string;
  label: string;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface ProgressStats {
  lastScore: number | null;
  testsCompleted: number;
  accuracy: number | null;
  questionsPracticed?: number;
}

export function ProgressOverview() {
  const [targetScore, setTargetScore] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [tempTargetScore, setTempTargetScore] = useState(targetScore);
  const [examDate, setExamDate] = useState("");
  const [selectedExamDateId, setSelectedExamDateId] = useState<string>("");
  const [availableExamDates, setAvailableExamDates] = useState<ExamDate[]>([]);
  const [countdown, setCountdown] = useState<CountdownTime | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingExamDates, setIsLoadingExamDates] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(
    null,
  );
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  // Load progress (lastScore, testsCompleted, accuracy) from API
  useEffect(() => {
    async function loadProgress() {
      try {
        setIsLoadingProgress(true);
        const res = await fetch("/api/auth/progress", {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setProgressStats({
            lastScore: data.lastScore ?? null,
            testsCompleted: data.testsCompleted ?? 0,
            accuracy: data.accuracy ?? null,
            questionsPracticed: data.questionsPracticed ?? 0,
          });
        } else {
          setProgressStats({
            lastScore: null,
            testsCompleted: 0,
            accuracy: null,
            questionsPracticed: 0,
          });
        }
      } catch {
        setProgressStats({
          lastScore: null,
          testsCompleted: 0,
          accuracy: null,
          questionsPracticed: 0,
        });
      } finally {
        setIsLoadingProgress(false);
      }
    }
    loadProgress();
  }, []);

  // Load profile (targetScore, examDate) and exam dates list from API; profil egasi ma'lumoti saqlanadi
  useEffect(() => {
    async function load() {
      try {
        setIsLoadingInitial(true);
        setIsLoadingExamDates(true);

        const [user, datesRes] = await Promise.all([
          authService.getCurrentUser(),
          fetch("/api/exams/dates", { method: "GET", credentials: "include" }),
        ]);

        // Target score va exam date profil dan (PATCH /auth/profile orqali saqlangan)
        if (user.targetScore) {
          setTargetScore(user.targetScore.toString());
          setTempTargetScore(user.targetScore.toString());
        } else {
          setTargetScore("1580");
          setTempTargetScore("1580");
        }

        const dateStr = user.examDate ? user.examDate.slice(0, 10) : "";

        let datesList: ExamDate[] = [];
        if (datesRes.ok) {
          const data = await datesRes.json();
          datesList = Array.isArray(data)
            ? data
            : data.dates || data.data || [];
        }
        setAvailableExamDates(datesList);

        // Profil dagi exam date ni select da ko'rsatish (sana bo'yicha match)
        if (dateStr) {
          setExamDate(dateStr);
          const found = datesList.find((d: ExamDate) => d.date === dateStr);
          if (found) setSelectedExamDateId(found.id);
        }
      } catch (err) {
        console.error("Failed to load:", err);
        setTargetScore("1580");
        setTempTargetScore("1580");
      } finally {
        setIsLoadingInitial(false);
        setIsLoadingExamDates(false);
      }
    }

    load();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!examDate) {
      setCountdown(null);
      return;
    }

    const calculateCountdown = () => {
      const now = new Date();
      const target = new Date(examDate + "T00:00:00");

      // If exam date is in the past, show 0
      if (target <= now) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const diff = target.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    // Calculate immediately
    calculateCountdown();

    // Update every second
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [examDate]);

  const handleSave = async () => {
    const scoreValue = parseInt(tempTargetScore, 10);

    // Validate target score
    if (isNaN(scoreValue) || scoreValue < 400 || scoreValue > 1600) {
      setError("Target score must be between 400 and 1600");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Save target score and exam date in one request (PATCH /auth/profile — kam request)
      await authService.updateProfile({
        targetScore: scoreValue,
        examDate: examDate || undefined,
      });

      setTargetScore(tempTargetScore);
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save target score. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setTempTargetScore(targetScore);
    setIsEditing(false);
    setError(null);
  };

  const handleExamDateChange = async (examDateId: string) => {
    if (!examDateId) {
      setSelectedExamDateId("");
      setExamDate("");
      return;
    }

    const selectedDate = availableExamDates.find((d) => d.id === examDateId);
    if (!selectedDate) return;

    try {
      setIsLoading(true);
      setError(null);

      // Save exam date via PATCH /auth/profile (ISO 8601)
      await authService.updateProfile({ examDate: selectedDate.date });

      setSelectedExamDateId(examDateId);
      setExamDate(selectedDate.date);
    } catch (err) {
      console.error("Failed to save exam date:", err);
      setError("Failed to save exam date. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress stats from API: last score, tests completed, accuracy */}
      <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center shadow-sm">
              <Award className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Your Progress
              </CardTitle>
              <p className="text-sm text-gray-600 mt-0.5">
                Real stats from your practice
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingProgress ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">Loading progress...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Oxirgi ball</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {progressStats?.lastScore != null
                    ? progressStats.lastScore
                    : "—"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">out of 1600</p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Ishlagan testlar
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {progressStats?.testsCompleted ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">tugatilgan</p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Accuracy</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {progressStats?.accuracy != null
                    ? `${progressStats.accuracy}%`
                    : "—"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">oxirgi test</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exam Countdown Card */}
        <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden rounded-2xl">
          <CardHeader className="pb-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center shadow-sm">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Exam Countdown
                </CardTitle>
                <p className="text-sm text-gray-600 mt-0.5">
                  Time until your SAT test
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!examDate ? (
              <>
                <p className="text-sm text-gray-600">
                  Select your official SAT test date to activate a personalized
                  countdown timer.
                </p>
                <div className="relative">
                  {isLoadingExamDates ? (
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">
                      Loading exam dates...
                    </div>
                  ) : (
                    <select
                      value={selectedExamDateId}
                      onChange={(e) => handleExamDateChange(e.target.value)}
                      disabled={isLoading}
                      className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    >
                      <option value="">
                        {availableExamDates.length === 0
                          ? "No exam dates available"
                          : "Choose your exam date"}
                      </option>
                      {availableExamDates.map((date) => (
                        <option key={date.id} value={date.id}>
                          {date.label ||
                            new Date(date.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                        </option>
                      ))}
                    </select>
                  )}
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              </>
            ) : null}

            {countdown !== null && examDate && (
              <div>
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="text-center">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-2 transition-all duration-300 hover:shadow-md hover:border-gray-300 min-h-[100px] flex flex-col items-center justify-center">
                      <p className="text-4xl md:text-5xl font-bold text-gray-900 leading-none mb-1">
                        {countdown.days}
                      </p>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-2 transition-all duration-300 hover:shadow-md hover:border-gray-300 min-h-[100px] flex flex-col items-center justify-center">
                      <p className="text-4xl md:text-5xl font-bold text-gray-900 leading-none mb-1">
                        {String(countdown.hours).padStart(2, "0")}
                      </p>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-2 transition-all duration-300 hover:shadow-md hover:border-gray-300 min-h-[100px] flex flex-col items-center justify-center">
                      <p className="text-4xl md:text-5xl font-bold text-gray-900 leading-none mb-1">
                        {String(countdown.minutes).padStart(2, "0")}
                      </p>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Minutes
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-2 transition-all duration-200 relative overflow-hidden min-h-[100px] flex flex-col items-center justify-center hover:shadow-md hover:border-gray-300">
                      <p className="text-4xl md:text-5xl font-bold text-gray-900 leading-none mb-1 transition-all duration-200">
                        {String(countdown.seconds).padStart(2, "0")}
                      </p>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seconds
                      </p>
                    </div>
                  </div>
                </div>
                {countdown.days === 0 &&
                  countdown.hours === 0 &&
                  countdown.minutes === 0 &&
                  countdown.seconds === 0 && (
                    <p className="text-center text-sm text-red-600 font-medium mb-4">
                      Exam date has passed
                    </p>
                  )}
                <div className="text-center pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedExamDateId("");
                      setExamDate("");
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 underline-offset-2 hover:underline font-medium"
                  >
                    Change Date
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Target Score Card */}
        <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden rounded-2xl">
          <CardHeader className="pb-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center shadow-sm">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Your Target Score
                </CardTitle>
                <p className="text-sm text-gray-600 mt-0.5">
                  Set your SAT goal
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingInitial ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Loading...</p>
              </div>
            ) : !isEditing ? (
              <>
                <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-2xl">
                  <p className="text-sm text-gray-600 mb-2">Current Target</p>
                  <p className="text-6xl font-bold text-gray-900 mb-2">
                    {targetScore || "Not set"}
                  </p>
                  <p className="text-xs text-gray-500">out of 1600</p>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  This appears on your{" "}
                  <Link
                    href="/results"
                    className="text-gray-900 hover:text-gray-700 hover:underline font-medium transition-colors"
                  >
                    Results
                  </Link>{" "}
                  page.
                </p>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl py-3 font-semibold"
                >
                  Change Target Score
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-900">
                    Current Target
                  </p>
                  <Input
                    type="number"
                    min="400"
                    max="1600"
                    value={tempTargetScore}
                    onChange={(e) => {
                      setTempTargetScore(e.target.value);
                      setError(null);
                    }}
                    className="text-3xl font-bold bg-gray-50 border-gray-200 focus:border-gray-900 focus:ring-gray-900/20 rounded-xl py-4 text-center"
                    placeholder="Enter target score (400-1600)"
                    disabled={isLoading}
                  />
                  {error && (
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50 shadow-sm hover:shadow-md rounded-xl py-3 font-semibold"
                  >
                    {isLoading ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50 py-3"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
