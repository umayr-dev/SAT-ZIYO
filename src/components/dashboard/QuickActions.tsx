"use client";

import {
  BookOpen,
  Brain,
  BarChart3,
  Users,
  BookText,
  PlayCircle,
} from "lucide-react";
import { Card, CardContent } from "@/src/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";

const quickActions = [
  {
    label: "Start Practice",
    icon: <PlayCircle className="h-6 w-6" />,
    href: "/dashboard/practice",
    gradient: "from-blue-500 to-blue-600",
    description: "Begin your daily practice",
  },
  {
    label: "Question Bank",
    icon: <BookText className="h-6 w-6" />,
    href: "/dashboard/question-bank",
    gradient: "from-purple-500 to-purple-600",
    description: "Browse questions",
  },
  {
    label: "Study Plan",
    icon: <Brain className="h-6 w-6" />,
    href: "/dashboard/study-plan",
    gradient: "from-green-500 to-green-600",
    description: "AI-powered plan",
  },
  {
    label: "Analytics",
    icon: <BarChart3 className="h-6 w-6" />,
    href: "/dashboard/analytics",
    gradient: "from-orange-500 to-orange-600",
    description: "View progress",
  },
  {
    label: "Classes",
    icon: <Users className="h-6 w-6" />,
    href: "/dashboard/classes",
    gradient: "from-indigo-500 to-indigo-600",
    description: "Join classes",
  },
  {
    label: "Vocabulary",
    icon: <BookOpen className="h-6 w-6" />,
    href: "/dashboard/vocabulary",
    gradient: "from-pink-500 to-pink-600",
    description: "Learn words",
  },
];

export function QuickActions() {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group">
              <CardContent className="p-6 text-center">
                <div
                  className={cn(
                    "w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-200",
                    action.gradient
                  )}
                >
                  {action.icon}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {action.label}
                </h3>
                <p className="text-xs text-gray-500">{action.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
