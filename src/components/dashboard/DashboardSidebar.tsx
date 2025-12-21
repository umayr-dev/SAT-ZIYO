"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  BookText,
  Users,
  BarChart3,
  Brain,
  TrendingUp,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/src/ui/card";
import { Button } from "@/src/ui/button";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  badgeColor?: "green" | "blue";
}

const menuItems: MenuItem[] = [
  { label: "Home", icon: <Home className="h-5 w-5" />, href: "/dashboard" },
  {
    label: "Practice",
    icon: <BookOpen className="h-5 w-5" />,
    href: "/dashboard/practice",
  },
  {
    label: "Question Bank",
    icon: <BookText className="h-5 w-5" />,
    href: "/dashboard/question-bank",
    badge: "Free",
    badgeColor: "green",
  },
  {
    label: "Classes",
    icon: <Users className="h-5 w-5" />,
    href: "/dashboard/classes",
  },
  {
    label: "Vocabulary",
    icon: <BarChart3 className="h-5 w-5" />,
    href: "/dashboard/vocabulary",
  },
  {
    label: "Study Plan",
    icon: <Brain className="h-5 w-5" />,
    href: "/dashboard/study-plan",
    badge: "AI",
    badgeColor: "green",
  },
];

const bottomMenuItems: MenuItem[] = [
  {
    label: "Performance Analytics",
    icon: <TrendingUp className="h-5 w-5" />,
    href: "/dashboard/analytics",
  },
  {
    label: "Support",
    icon: <Headphones className="h-5 w-5" />,
    href: "/dashboard/support",
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">SZ</span>
          </div>
          <span className="text-xl font-bold text-gray-900">SAT Ziyo</span>
        </div>
      </div>

      {/* Menu */}
      <div className="p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          MENU
        </h3>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      item.badgeColor === "green"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Daily Streak Card */}
      <div className="px-4 pb-4">
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-900">
                  Daily Streak
                </span>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                  ACTIVE
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">1 days</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: "33%" }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-gray-600">Active today ✓ 2 to go</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Button */}
      <div className="px-4 pb-4">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
          Upgrade to Pro
        </Button>
      </div>

      {/* Bottom Menu */}
      <div className="px-4 pb-4 mt-auto">
        <nav className="space-y-1">
          {bottomMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
