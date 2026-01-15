"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  BookOpen,
  BookText,
  Users,
  BarChart3,
  Brain,
  TrendingUp,
  Headphones,
  Settings,
  LogOut,
  PanelLeftClose,
  ChevronLeft,
  ChevronRight,
  Zap,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { useLogout } from "@/src/hooks/use-auth";
import { useSidebar } from "./SidebarContext";

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
    href: "/support",
  },
  {
    label: "Settings",
    icon: <Settings className="h-5 w-5" />,
    href: "/settings",
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logoutMutation = useLogout();
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const handleLogout = async () => {
    try {
      // Start logout process but don't wait - redirect immediately
      logoutMutation.mutateAsync().catch(() => {
        // Silently handle errors
      });
      // Immediate redirect to home page
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if API call fails, redirect to home page
      window.location.href = "/";
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <div
        className={cn(
          "bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col overflow-hidden transition-all duration-300 z-40",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "border-b border-gray-200 flex-shrink-0 relative",
            isCollapsed ? "p-4 pb-3" : "p-4 pr-14"
          )}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center flex-shrink-0"
              >
                <Image
                  src="/alogo.jpg"
                  alt="SAT Ziyo Logo"
                  width={120}
                  height={40}
                  className="h-10 w-auto object-contain"
                  priority
                />
              </Link>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 leading-tight">
                  SAT Ziyo
                </span>
                <span className="text-xs text-gray-600 leading-tight">
                  Digital SAT Prep
                </span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex flex-col items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center justify-center"
              >
                <Image
                  src="/alogo.jpg"
                  alt="SAT Ziyo Logo"
                  width={40}
                  height={40}
                  className="h-10 w-auto object-contain"
                  priority
                />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 shadow-lg hover:bg-blue-50 hover:border-blue-900 hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
                onClick={toggleSidebar}
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4 text-gray-700 group-hover:text-blue-900 transition-colors" />
              </Button>
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 -translate-y-1/2 right-2 w-10 h-10 rounded-full bg-white border-2 border-gray-300 shadow-lg hover:bg-blue-50 hover:border-blue-900 hover:shadow-xl z-50 transition-all duration-200 flex items-center justify-center group"
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-5 w-5 text-gray-700 group-hover:text-blue-900 transition-colors" />
            </Button>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Menu */}
          <div className={cn("p-3", isCollapsed && "px-2")}>
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                MENU
              </h3>
            )}
            <nav className="space-y-0.5">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg text-sm font-medium transition-colors group relative",
                      isCollapsed
                        ? "justify-center px-2 py-2"
                        : "justify-between px-3 py-2",
                      isActive
                        ? "bg-blue-900 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>
                    {!isCollapsed && item.badge && (
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          item.badgeColor === "green"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-900"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isCollapsed && item.badge && (
                      <span
                        className={cn(
                          "absolute -top-1 -right-1 w-2 h-2 rounded-full",
                          item.badgeColor === "green"
                            ? "bg-green-500"
                            : "bg-blue-900"
                        )}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Daily Streak Card */}
          {!isCollapsed && (
            <div className="px-3 pb-3">
              <div className="animated-border">
                <Card className="bg-gray-50 border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-semibold text-gray-900">
                        Daily Streak
                      </span>
                      <span className="ml-auto text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                        ACTIVE
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-gray-900">
                        1 days
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="text-lg font-bold text-gray-900">3</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Active today ✓ 2 to go
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Upgrade Button */}
          {!isCollapsed && (
            <div className="px-3 pb-3">
              <Button className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium">
                Upgrade to Pro
              </Button>
            </div>
          )}
        </div>

        {/* Fixed Bottom Section */}
        <div className="flex-shrink-0 border-t border-gray-200">
          {/* Bottom Menu */}
          <div className={cn("px-3 pt-3 pb-2", isCollapsed && "px-2")}>
            <nav className="space-y-0.5">
              {bottomMenuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg text-sm font-medium transition-colors",
                      isCollapsed
                        ? "justify-center px-2 py-2"
                        : "gap-3 px-3 py-2",
                      isActive
                        ? "bg-blue-900 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
      {/* Spacer for collapsed sidebar */}
      <div
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "w-20" : "w-64"
        )}
      />
    </>
  );
}
