"use client";

import { useEffect, useState } from "react";
import { practiceService } from "@/src/services/practice.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/ui/card";
import { Eye, Play, CheckCircle, MessageSquare, TrendingUp, Clock } from "lucide-react";

interface TestAnalyticsProps {
  testId: string;
}

interface AnalyticsData {
  testId: string;
  title: string;
  viewCount: number;
  attemptCount: number;
  completionCount: number;
  completionRate: number;
  averageScore: number | null;
  averageTimeMinutes: number | null;
  commentCount: number;
}

export function TestAnalytics({ testId }: TestAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await practiceService.getTestAnalytics(testId);
        setAnalytics(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch test analytics:", err);
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      fetchAnalytics();
    }
  }, [testId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !analytics) {
    return null; // Don't show error, just don't render
  }

  const formatTime = (minutes: number | null): string => {
    if (minutes === null) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Card className="bg-white shadow-sm border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Test Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* View Count */}
          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
            <Eye className="h-5 w-5 text-gray-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {analytics.viewCount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 mt-1">Views</div>
          </div>

          {/* Attempt Count */}
          <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
            <Play className="h-5 w-5 text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {analytics.attemptCount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 mt-1">Attempts</div>
          </div>

          {/* Completion Count */}
          <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {analytics.completionCount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 mt-1">Completed</div>
          </div>

          {/* Completion Rate */}
          <div className="flex flex-col items-center p-3 bg-purple-50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-purple-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {analytics.completionRate}%
            </div>
            <div className="text-xs text-gray-600 mt-1">Completion</div>
          </div>

          {/* Average Score */}
          <div className="flex flex-col items-center p-3 bg-orange-50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-orange-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {analytics.averageScore !== null
                ? analytics.averageScore.toLocaleString()
                : "N/A"}
            </div>
            <div className="text-xs text-gray-600 mt-1">Avg Score</div>
          </div>

          {/* Average Time */}
          <div className="flex flex-col items-center p-3 bg-indigo-50 rounded-lg">
            <Clock className="h-5 w-5 text-indigo-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(analytics.averageTimeMinutes)}
            </div>
            <div className="text-xs text-gray-600 mt-1">Avg Time</div>
          </div>
        </div>

        {/* Comment Count */}
        {analytics.commentCount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 text-sm text-gray-600">
            <MessageSquare className="h-4 w-4" />
            <span>
              {analytics.commentCount} {analytics.commentCount === 1 ? "comment" : "comments"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

