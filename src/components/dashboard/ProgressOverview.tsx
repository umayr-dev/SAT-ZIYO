"use client";

import { useState, useEffect } from "react";
import { Calendar, TrendingUp, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import Link from "next/link";
import { authService } from "@/src/services/auth.service";
import { API_CONFIG, API_ENDPOINTS } from "@/src/config/api";

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

  // Load target score and exam date from API on mount
  useEffect(() => {
    async function loadUserData() {
      try {
        setIsLoadingInitial(true);
        const user = await authService.getCurrentUser();

        // Load target score
        if (user.targetScore) {
          setTargetScore(user.targetScore.toString());
          setTempTargetScore(user.targetScore.toString());
        } else {
          setTargetScore("1580");
          setTempTargetScore("1580");
        }

        // Load selected exam date (if user has examDateId in profile)
        if ((user as any).examDateId) {
          setSelectedExamDateId((user as any).examDateId);
        }
      } catch (err) {
        console.error("Failed to load user data:", err);
        setTargetScore("1580");
        setTempTargetScore("1580");
      } finally {
        setIsLoadingInitial(false);
      }
    }

    loadUserData();
  }, []);

  // Load available exam dates (default dates until API is ready)
  useEffect(() => {
    // Default exam dates - will be replaced with API call later
    const defaultDates: ExamDate[] = [
      {
        id: "1",
        date: "2026-03-09",
        label: "March 9, 2026",
      },
      {
        id: "2",
        date: "2026-05-04",
        label: "May 4, 2026",
      },
    ];

    setAvailableExamDates(defaultDates);
    setIsLoadingExamDates(false);

    // If user has selected exam date, find and set it
    if (selectedExamDateId) {
      const selectedDate = defaultDates.find(
        (d) => d.id === selectedExamDateId
      );
      if (selectedDate) {
        setExamDate(selectedDate.date);
      }
    }

    // TODO: Replace with API call when backend is ready
    // async function loadExamDates() {
    //   try {
    //     setIsLoadingExamDates(true);
    //     const response = await fetch("/api/exams/dates", {
    //       method: "GET",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       credentials: "include",
    //     });
    //     if (response.ok) {
    //       const data = await response.json();
    //       const dates = Array.isArray(data) ? data : data.dates || data.data || [];
    //       setAvailableExamDates(dates);
    //       if (selectedExamDateId) {
    //         const selectedDate = dates.find((d: ExamDate) => d.id === selectedExamDateId);
    //         if (selectedDate) {
    //           setExamDate(selectedDate.date);
    //         }
    //       }
    //     }
    //   } catch (err) {
    //     console.error("Failed to load exam dates:", err);
    //   } finally {
    //     setIsLoadingExamDates(false);
    //   }
    // }
    // loadExamDates();
  }, [selectedExamDateId]);

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
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
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
      // Save to API
      await authService.updateProfile({
        targetScore: scoreValue,
      });

      // Update local state on success
      setTargetScore(tempTargetScore);
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save target score. Please try again."
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

    try {
      setIsLoading(true);
      setError(null);

      // Save selected exam date locally (will be replaced with API call later)
      setSelectedExamDateId(examDateId);
      const selectedDate = availableExamDates.find((d) => d.id === examDateId);
      if (selectedDate) {
        setExamDate(selectedDate.date);
      }

      // TODO: Replace with API call when backend is ready
      // const response = await fetch("/api/exams/select", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   credentials: "include",
      //   body: JSON.stringify({ examDateId }),
      // });
      // if (response.ok) {
      //   setSelectedExamDateId(examDateId);
      //   const selectedDate = availableExamDates.find((d) => d.id === examDateId);
      //   if (selectedDate) {
      //     setExamDate(selectedDate.date);
      //   }
      // } else {
      //   const errorData = await response.json().catch(() => ({}));
      //   setError(errorData.message || "Failed to save exam date");
      // }
    } catch (err) {
      console.error("Failed to save exam date:", err);
      setError("Failed to save exam date. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Exam Countdown Card */}
      <Card className="border-0 shadow-sm bg-gray-50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center shadow-sm">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg font-bold text-gray-900">
              Exam Countdown
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!examDate ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Select your official SAT test date to activate a personalized
                countdown timer.
              </p>
              <div className="relative">
                {isLoadingExamDates ? (
                  <div className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500">
                    Loading exam dates...
                  </div>
                ) : (
                  <select
                    value={selectedExamDateId}
                    onChange={(e) => handleExamDateChange(e.target.value)}
                    disabled={isLoading}
                    className="w-full appearance-none bg-white border border-gray-200 rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="mt-4">
              <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-5">
                <div className="text-center">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 sm:p-4 mb-2 transition-all duration-300 hover:shadow-md min-h-[80px] sm:min-h-[100px] flex items-center justify-center">
                    <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-900 leading-none">
                      {countdown.days}
                    </p>
                  </div>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 sm:p-4 mb-2 transition-all duration-300 hover:shadow-md min-h-[80px] sm:min-h-[100px] flex items-center justify-center">
                    <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-900 leading-none">
                      {String(countdown.hours).padStart(2, "0")}
                    </p>
                  </div>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 sm:p-4 mb-2 transition-all duration-300 hover:shadow-md min-h-[80px] sm:min-h-[100px] flex items-center justify-center">
                    <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-900 leading-none">
                      {String(countdown.minutes).padStart(2, "0")}
                    </p>
                  </div>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Minutes
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 sm:p-4 mb-2 transition-all duration-200 relative overflow-hidden min-h-[80px] sm:min-h-[100px] flex items-center justify-center">
                    <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-900 leading-none transition-all duration-200">
                      {String(countdown.seconds).padStart(2, "0")}
                    </p>
                  </div>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seconds
                  </p>
                </div>
              </div>
              {countdown.days === 0 &&
                countdown.hours === 0 &&
                countdown.minutes === 0 &&
                countdown.seconds === 0 && (
                  <p className="text-center text-sm text-red-600 mt-3 font-medium">
                    Exam date has passed
                  </p>
                )}
              <div className="text-center mt-5 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedExamDateId("");
                    setExamDate("");
                  }}
                  className="text-sm text-blue-900 hover:text-blue-800 transition-colors duration-200 underline-offset-2 hover:underline font-medium"
                >
                  Change Date
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target Score Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg font-bold text-gray-900">
              Your Target Score
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingInitial ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          ) : !isEditing ? (
            <>
              <p className="text-sm text-gray-600 mb-2">Current Target</p>
              <p className="text-4xl font-bold text-gray-900 mb-4">
                {targetScore || "Not set"}
              </p>
              <p className="text-sm text-gray-600 mb-6">
                This appears on your{" "}
                <Link
                  href="/results"
                  className="text-blue-900 hover:underline font-medium"
                >
                  Results
                </Link>{" "}
                page.
              </p>
              <Button
                onClick={() => setIsEditing(true)}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white"
              >
                Change
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Current Target</p>
                <Input
                  type="number"
                  min="400"
                  max="1600"
                  value={tempTargetScore}
                  onChange={(e) => {
                    setTempTargetScore(e.target.value);
                    setError(null);
                  }}
                  className="text-2xl font-bold"
                  placeholder="Enter target score (400-1600)"
                  disabled={isLoading}
                />
                {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 bg-blue-900 hover:bg-blue-800 text-white disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
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
  );
}
