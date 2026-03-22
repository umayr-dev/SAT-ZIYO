"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { flushSync } from "react-dom";
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
  previousAccuracy?: number | null;
  questionsPracticed?: number;
}

export function ProgressOverview() {
  const [targetScore, setTargetScore] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [tempTargetScore, setTempTargetScore] = useState(targetScore);
  const [examDate, setExamDate] = useState("");
  const [selectedExamDateId, setSelectedExamDateId] = useState<string>("");
  const [availableExamDates, setAvailableExamDates] = useState<ExamDate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingExamDates, setIsLoadingExamDates] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(
    null,
  );
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [countdownTick, setCountdownTick] = useState(0);
  const userSelectedExamDateRef = useRef<{ date: string; id: string } | null>(null);

  // Countdown: compute from examDate so it shows immediately when date is selected (no reload)
  const countdown = useMemo((): CountdownTime | null => {
    if (!examDate) return null;
    const target = new Date(examDate + "T00:00:00");
    if (Number.isNaN(target.getTime())) return null;
    const now = new Date();
    if (target <= now) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const diff = target.getTime() - now.getTime();
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
  }, [examDate, countdownTick]); // countdownTick: re-run every second

  // Tick every second so countdown updates (useMemo depends on countdownTick)
  useEffect(() => {
    if (!examDate) return;
    const interval = setInterval(() => setCountdownTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [examDate]);

  // Load progress (lastScore, testsCompleted, accuracy) from API
  useEffect(() => {
    async function loadProgress() {
      try {
        setIsLoadingProgress(true);
        const res = await fetch("/api/auth/progress", {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setProgressStats({
            lastScore: data.lastScore ?? null,
            testsCompleted: data.testsCompleted ?? 0,
            accuracy: data.accuracy ?? null,
            previousAccuracy: data.previousAccuracy ?? null,
            questionsPracticed: data.questionsPracticed ?? 0,
          });
        } else {
          setProgressStats({
            lastScore: null,
            testsCompleted: 0,
            accuracy: null,
            previousAccuracy: null,
            questionsPracticed: 0,
          });
        }
      } catch {
        setProgressStats({
          lastScore: null,
          testsCompleted: 0,
          accuracy: null,
          previousAccuracy: null,
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
          fetch("/api/exam-dates", { method: "GET", credentials: "include" }),
        ]);

        if (user.targetScore) {
          setTargetScore(user.targetScore.toString());
          setTempTargetScore(user.targetScore.toString());
        } else {
          setTargetScore("1580");
          setTempTargetScore("1580");
        }

        let datesList: ExamDate[] = [];
        if (datesRes.ok) {
          const data = await datesRes.json();
          datesList = Array.isArray(data) ? data : [];
        }
        setAvailableExamDates(datesList);

        // Agar foydalanuvchi select qilgan bo'lsa (load tugashidan oldin), uni ustun qil – reload kerak bo'lmasin
        const selected = userSelectedExamDateRef.current;
        if (selected) {
          setExamDate(selected.date);
          setSelectedExamDateId(selected.id);
          userSelectedExamDateRef.current = null;
        } else {
          const dateStr = user.examDate ? user.examDate.slice(0, 10) : "";
          if (dateStr) {
            setExamDate(dateStr);
            const found = datesList.find((d: ExamDate) => d.date === dateStr);
            if (found) setSelectedExamDateId(found.id);
          }
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
      userSelectedExamDateRef.current = null;
      setSelectedExamDateId("");
      setExamDate("");
      try {
        await authService.updateProfile({ examDate: undefined });
      } catch {
        // ignore
      }
      return;
    }

    const selectedDate = availableExamDates.find((d) => d.id === examDateId);
    if (!selectedDate) return;

    const dateStr = selectedDate.date.slice(0, 10);
    userSelectedExamDateRef.current = { date: dateStr, id: examDateId };

    // Darhol UI yangilansin (reload kerak bo‘lmasin)
    flushSync(() => {
      setSelectedExamDateId(examDateId);
      setExamDate(dateStr);
      setError(null);
    });

    try {
      await authService.updateProfile({ examDate: dateStr });
    } catch (err) {
      console.error("Failed to save exam date:", err);
      setError("Failed to save exam date. Please try again.");
      userSelectedExamDateRef.current = null;
      const user = await authService.getCurrentUser();
      const dateStr = user.examDate ? user.examDate.slice(0, 10) : "";
      if (dateStr) {
        setExamDate(dateStr);
        const found = availableExamDates.find((d) => d.date === dateStr);
        if (found) setSelectedExamDateId(found.id);
      } else {
        setSelectedExamDateId("");
        setExamDate("");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress stats from API: last score, tests completed, accuracy — orange theme */}
      <Card className="border border-brand-orange-light shadow-sm bg-white overflow-hidden rounded-xl sm:rounded-2xl">
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-brand-orange rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
              <Award className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-xl font-bold text-brand-orange">
                Your Progress
              </CardTitle>
              <p className="text-xs sm:text-sm text-black mt-0.5">
                Real stats from your practice
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          {isLoadingProgress ? (
            <div className="text-center py-4 sm:py-6">
              <p className="text-xs sm:text-sm text-brand-orange/70">
                Loading progress...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Last score */}
              <div className="p-3 sm:p-4 bg-white border border-brand-blue-light rounded-lg sm:rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-brand-blue/70" />
                  <span className="text-xs sm:text-sm text-black">
                    Latest score
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-brand-blue">
                  {progressStats?.lastScore != null
                    ? progressStats.lastScore
                    : "—"}
                </p>
                <p className="text-xs text-black mt-0.5">
                  out of 1600
                </p>
              </div>
              {/* Completed tests */}
              <div className="p-3 sm:p-4 bg-white border border-brand-blue-light rounded-lg sm:rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck className="h-4 w-4 text-brand-blue/80" />
                  <span className="text-xs sm:text-sm text-black">
                    Completed tests
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-brand-blue">
                  {progressStats?.testsCompleted ?? 0}
                </p>
              </div>
              {/* Accuracy */}
              <div className="p-3 sm:p-4 bg-white border border-brand-blue-light rounded-lg sm:rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4 text-brand-blue/70" />
                  <span className="text-xs sm:text-sm text-black">Accuracy</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-brand-blue">
                  {progressStats?.accuracy != null
                    ? `${progressStats.accuracy}%`
                    : "—"}
                </p>
                {progressStats?.previousAccuracy != null &&
                progressStats?.accuracy != null &&
                (progressStats.accuracy > progressStats.previousAccuracy ||
                  progressStats.accuracy < progressStats.previousAccuracy) ? (
                  <p className="text-xs text-black mt-0.5">
                    {progressStats.accuracy > progressStats.previousAccuracy
                      ? `↑ improved (previous: ${progressStats.previousAccuracy}%)`
                      : `previous: ${progressStats.previousAccuracy}%`}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exam Countdown Card */}
        <Card className="border border-brand-orange-light shadow-sm bg-white overflow-hidden rounded-2xl">
          <CardHeader className="pb-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-brand-orange rounded-2xl flex items-center justify-center shadow-sm">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-brand-orange">
                  Exam Countdown
                </CardTitle>
                <p className="text-sm text-black mt-0.5">
                  Time until your SAT test
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!examDate ? (
              <>
                <p className="text-sm text-black">
                  Select your official SAT test date to activate a personalized
                  countdown timer.
                </p>
                <div className="relative">
                  {isLoadingExamDates ? (
                    <div className="w-full bg-brand-blue-50 border border-brand-blue-light rounded-xl px-4 py-3 text-sm text-brand-blue/70">
                      Loading exam dates...
                    </div>
                  ) : (
                    <select
                      value={selectedExamDateId}
                      onChange={(e) => handleExamDateChange(e.target.value)}
                      disabled={isLoading}
                      className="w-full appearance-none bg-brand-blue-50 border border-brand-blue-light rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
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
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-blue/60 pointer-events-none" />
                </div>
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              </>
            ) : null}

            {examDate && (
              <div>
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="text-center">
                    <div className="bg-brand-blue-50 border border-brand-blue-light rounded-2xl p-4 mb-2 transition-all duration-300 hover:shadow-md hover:border-brand-blue/30 min-h-[100px] flex flex-col items-center justify-center">
                      <p className="text-4xl md:text-5xl font-bold text-brand-blue leading-none mb-1">
                        {countdown?.days ?? "—"}
                      </p>
                      <p className="text-xs font-medium text-brand-blue/70 uppercase tracking-wider">
                        Days
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="bg-brand-blue-50 border border-brand-blue-light rounded-2xl p-4 mb-2 transition-all duration-300 hover:shadow-md hover:border-brand-blue/30 min-h-[100px] flex flex-col items-center justify-center">
                      <p className="text-4xl md:text-5xl font-bold text-brand-blue leading-none mb-1">
                        {countdown != null ? String(countdown.hours).padStart(2, "0") : "—"}
                      </p>
                      <p className="text-xs font-medium text-brand-blue/70 uppercase tracking-wider">
                        Hours
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="bg-brand-blue-50 border border-brand-blue-light rounded-2xl p-4 mb-2 transition-all duration-300 hover:shadow-md hover:border-brand-blue/30 min-h-[100px] flex flex-col items-center justify-center">
                      <p className="text-4xl md:text-5xl font-bold text-brand-blue leading-none mb-1">
                        {countdown != null ? String(countdown.minutes).padStart(2, "0") : "—"}
                      </p>
                      <p className="text-xs font-medium text-brand-blue/70 uppercase tracking-wider">
                        Minutes
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="bg-brand-blue-50 border border-brand-blue-light rounded-2xl p-4 mb-2 transition-all duration-200 relative overflow-hidden min-h-[100px] flex flex-col items-center justify-center hover:shadow-md hover:border-brand-blue/30">
                      <p className="text-4xl md:text-5xl font-bold text-brand-blue leading-none mb-1 transition-all duration-200">
                        {countdown != null ? String(countdown.seconds).padStart(2, "0") : "—"}
                      </p>
                      <p className="text-xs font-medium text-brand-blue/70 uppercase tracking-wider">
                        Seconds
                      </p>
                    </div>
                  </div>
                </div>
                {countdown != null &&
                  countdown.days === 0 &&
                  countdown.hours === 0 &&
                  countdown.minutes === 0 &&
                  countdown.seconds === 0 && (
                    <p className="text-center text-sm text-red-600 font-medium mb-4">
                      Exam date has passed
                    </p>
                  )}
                <div className="text-center pt-4 border-t border-brand-blue-light">
                  <button
                    onClick={async () => {
                      userSelectedExamDateRef.current = null;
                      setSelectedExamDateId("");
                      setExamDate("");
                      try {
                        await authService.updateProfile({ examDate: undefined });
                      } catch {
                        // ignore
                      }
                    }}
                    className="text-sm text-brand-blue/80 hover:text-brand-blue transition-colors duration-200 underline-offset-2 hover:underline font-medium"
                  >
                    Change Date
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Target Score Card — orange theme */}
        <Card className="border border-brand-orange-light shadow-sm bg-white overflow-hidden rounded-2xl">
          <CardHeader className="pb-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-brand-orange rounded-2xl flex items-center justify-center shadow-sm">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-brand-orange">
                  Your Target Score
                </CardTitle>
                <p className="text-sm text-black mt-0.5">
                  Set your SAT goal
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingInitial ? (
              <div className="text-center py-8">
                <p className="text-sm text-brand-blue/70">Loading...</p>
              </div>
            ) : !isEditing ? (
              <>
                <div className="text-center p-6 bg-brand-blue-50 border border-brand-blue-light rounded-2xl">
                  <p className="text-sm text-black mb-2">
                    Current Target
                  </p>
                  <p className="text-6xl font-bold text-brand-blue mb-2">
                    {targetScore || "Not set"}
                  </p>
                  <p className="text-xs text-black">out of 1600</p>
                </div>
                <p className="text-sm text-black text-center">
                  This appears on your{" "}
                  <Link
                    href="/results"
                    className="text-black hover:underline font-medium transition-colors"
                  >
                    Results
                  </Link>{" "}
                  page.
                </p>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl py-3 font-semibold"
                >
                  Change Target Score
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-black">
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
                    className="text-3xl font-bold bg-brand-blue-50 border-brand-blue-light focus:border-brand-blue focus:ring-brand-blue/20 rounded-xl py-4 text-center"
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
                    className="flex-1 bg-brand-blue hover:bg-brand-blue/90 text-white disabled:opacity-50 shadow-sm hover:shadow-md rounded-xl py-3 font-semibold"
                  >
                    {isLoading ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1 rounded-xl border-brand-blue-light hover:bg-brand-blue-light py-3"
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
