"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/src/components/dashboard/DashboardHeader";
import { ProgressOverview } from "@/src/components/dashboard/ProgressOverview";
import { authService } from "@/src/services/auth.service";
import type { UserProfile } from "@/src/types";
import { Target, TrendingUp, BarChart3, BookOpen, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/ui/card";
import Link from "next/link";

interface VocabularyWord {
  word: string;
  definition: string;
  example?: string;
  difficulty: "easy" | "medium" | "hard";
}

function DashboardContent() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sample vocabulary words - can be replaced with API call later
  const vocabularyWords: VocabularyWord[] = [
    {
      word: "Ambiguous",
      definition: "Having more than one possible meaning; unclear or uncertain",
      example: "The politician's statement was ambiguous and could be interpreted in different ways.",
      difficulty: "medium",
    },
    {
      word: "Eloquent",
      definition: "Fluent or persuasive in speaking or writing",
      example: "The speaker delivered an eloquent speech that moved the entire audience.",
      difficulty: "hard",
    },
  ];

  useEffect(() => {
    async function fetchUser() {
      try {
        const userProfile = await authService.getCurrentUser();
        setUser({
          id: userProfile.id,
          email: userProfile.email,
          role: userProfile.role,
          name: userProfile.name,
        });
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // AuthGuard will handle redirect
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "medium":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "hard":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <DashboardHeader user={user} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Vocabulary Words (2 columns on desktop) */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl h-full flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center shadow-sm">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Daily Vocabulary
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Learn new words every day
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/vocabulary">
                  <button className="text-sm font-semibold text-gray-900 hover:text-gray-700 flex items-center gap-1 transition-colors">
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              {vocabularyWords.map((vocab, index) => (
                <div
                  key={index}
                  className="flex-1 p-5 bg-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {vocab.word}
                        </h3>
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getDifficultyColor(
                            vocab.difficulty
                          )}`}
                        >
                          {vocab.difficulty.charAt(0).toUpperCase() +
                            vocab.difficulty.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed mb-2">
                        {vocab.definition}
                      </p>
                      {vocab.example && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Example:
                          </p>
                          <p className="text-sm text-gray-600 italic">
                            &quot;{vocab.example}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats (1 column on desktop) */}
        <div className="lg:col-span-1">
          <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl h-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-5">Your Stats</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Questions</span>
                    <Target className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">1,247</p>
                  <p className="text-xs text-gray-500 mt-1">Total practiced</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Current Score</span>
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">1,350</p>
                  <p className="text-xs text-gray-500 mt-1">Out of 1600</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Accuracy</span>
                    <BarChart3 className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">78%</p>
                  <p className="text-xs text-gray-500 mt-1">Average score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progress Overview - Full width below */}
      <div>
        <ProgressOverview />
      </div>
    </div>
  );
}

export function DashboardPageClient() {
  return <DashboardContent />;
}
