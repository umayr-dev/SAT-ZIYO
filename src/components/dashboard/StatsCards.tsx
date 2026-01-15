"use client";

import { useState, useEffect } from "react";
import { BookOpen, Target, TrendingUp, Clock, Award, Zap } from "lucide-react";
import { Card, CardContent } from "@/src/ui/card";
import { authService } from "@/src/services/auth.service";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  gradient: string;
}

function StatCard({
  icon,
  label,
  value,
  change,
  trend,
  gradient,
}: StatCardProps) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
            {change && (
              <div className="flex items-center gap-1">
                <TrendingUp
                  className={`h-4 w-4 ${
                    trend === "up"
                      ? "text-green-600"
                      : trend === "down"
                      ? "text-red-600"
                      : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    trend === "up"
                      ? "text-green-600"
                      : trend === "down"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {change}
                </span>
              </div>
            )}
          </div>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradient}`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  const [targetScore, setTargetScore] = useState<string>("1,500");

  useEffect(() => {
    async function loadTargetScore() {
      try {
        const user = await authService.getCurrentUser();
        if (user.targetScore) {
          setTargetScore(user.targetScore.toLocaleString());
        }
      } catch (err) {
        console.error("Failed to load target score:", err);
      }
    }

    loadTargetScore();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <StatCard
        icon={<BookOpen className="h-6 w-6 text-blue-900" />}
        label="Questions Practiced"
        value="1,247"
        change="+12% this week"
        trend="up"
        gradient="bg-blue-50"
      />
      <StatCard
        icon={<Target className="h-6 w-6 text-blue-800" />}
        label="Target Score"
        value={targetScore}
        change="150 points to go"
        trend="neutral"
        gradient="bg-blue-50"
      />
      <StatCard
        icon={<TrendingUp className="h-6 w-6 text-blue-700" />}
        label="Current Score"
        value="1,350"
        change="+45 points"
        trend="up"
        gradient="bg-blue-50"
      />
      <StatCard
        icon={<Clock className="h-6 w-6 text-blue-900" />}
        label="Study Time"
        value="24h"
        change="This month"
        trend="neutral"
        gradient="bg-blue-50"
      />
      <StatCard
        icon={<Award className="h-6 w-6 text-blue-800" />}
        label="Streak"
        value="7 days"
        change="Keep it up!"
        trend="up"
        gradient="bg-blue-50"
      />
      <StatCard
        icon={<Zap className="h-6 w-6 text-blue-700" />}
        label="Accuracy"
        value="78%"
        change="+5% improvement"
        trend="up"
        gradient="bg-blue-50"
      />
    </div>
  );
}
