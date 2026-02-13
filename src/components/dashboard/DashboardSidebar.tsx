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
  TrendingUp,
  Headphones,
  Menu,
  X,
  Zap,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { useSidebar } from "./SidebarContext";
import { useState } from "react";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  badgeColor?: "emerald" | "blue" | "amber";
}

// Only show actually available sections; hide "not allowed"/coming-soon items
const menuItems: MenuItem[] = [
  {
    label: "Home",
    icon: <Home className="h-5 w-5" />,
    href: "/dashboard",
  },
  {
    label: "Practice",
    icon: <BookOpen className="h-5 w-5" />,
    href: "/dashboard/practice",
  },
];

const bottomMenuItems: MenuItem[] = [
  {
    label: "Support",
    icon: <Headphones className="h-5 w-5" />,
    href: "/support",
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white text-brand-blue shadow-lg hover:shadow-xl border border-brand-blue-light transition-all duration-200"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "bg-white border-r border-brand-blue-light h-screen fixed left-0 top-0 flex flex-col overflow-hidden transition-all duration-300 z-40 shadow-sm",
          isCollapsed ? "w-20" : "w-72",
          "lg:translate-x-0",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo Section */}
        <div
          className={cn(
            "border-b border-brand-blue-light flex-shrink-0 relative bg-white",
            isCollapsed ? "p-4 pb-3" : "p-6 pr-16",
          )}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center flex-shrink-0"
              >
                <div className="relative bg-white p-2 rounded-xl border border-brand-blue-light shadow-sm">
                  <Image
                    src="/logo.png"
                    alt="SAT Ziyo Logo"
                    width={40}
                    height={40}
                    className="h-8 w-auto object-contain"
                    priority
                  />
                </div>
              </Link>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-brand-blue leading-tight">
                  SAT Ziyo
                </span>
                <span className="text-xs text-brand-blue/70 leading-tight">
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
                <div className="relative bg-white p-2 rounded-xl border border-brand-blue-light shadow-sm">
                  <Image
                    src="/logo.png"
                    alt="SAT Ziyo Logo"
                    width={40}
                    height={40}
                    className="h-10 w-auto object-contain"
                    priority
                  />
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-xl bg-brand-blue-light hover:bg-brand-blue-50 border border-brand-blue-light transition-all duration-200 flex items-center justify-center"
                onClick={toggleSidebar}
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 -translate-y-1/2 right-3 w-9 h-9 rounded-xl bg-brand-blue-light hover:bg-brand-blue-50 border border-brand-blue-light transition-all duration-200 flex items-center justify-center"
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
            >
              <X className="h-4 w-4 text-brand-blue" />
            </Button>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Menu */}
          <div className={cn("p-4", isCollapsed && "px-2")}>
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-brand-blue/60 uppercase tracking-wider mb-4 px-2">
                Navigation
              </h3>
            )}
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <div
                    key={item.href}
                    className="relative group/item [&>*]:after:!content-none [&>*]:after:!hidden"
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center rounded-xl text-sm font-medium transition-all duration-200 group relative border-r-0 after:content-none after:!hidden",
                        isCollapsed
                          ? "justify-center px-2 py-3"
                          : "justify-between px-4 py-3",
                        isActive
                          ? "bg-brand-blue text-white shadow-md"
                          : "text-brand-blue hover:bg-brand-blue-light hover:text-brand-blue",
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <div
                          className={cn(
                            "transition-colors duration-200",
                            isActive
                              ? "text-white"
                              : "text-brand-blue/70 group-hover:text-brand-blue",
                          )}
                        >
                          {item.icon}
                        </div>
                        {!isCollapsed && <span>{item.label}</span>}
                      </div>
                      {!isCollapsed && item.badge && (
                        <span
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-semibold relative z-10",
                            item.badgeColor === "emerald"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.badgeColor === "blue"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200",
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isCollapsed && item.badge && (
                        <span
                          className={cn(
                            "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full",
                            item.badgeColor === "emerald"
                              ? "bg-emerald-500"
                              : item.badgeColor === "blue"
                                ? "bg-blue-500"
                                : "bg-amber-500",
                          )}
                        />
                      )}
                    </Link>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Daily Streak Card — gray, inactive */}
          {!isCollapsed && (
            <div className="px-4 pb-4">
              <Card className="bg-brand-blue-50 border border-brand-blue-light overflow-hidden relative">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-brand-blue/60 rounded-lg">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-brand-blue/80">
                      Daily Streak
                    </span>
                    <span className="ml-auto text-xs px-2 py-1 bg-brand-blue-light text-brand-blue/70 rounded-full font-medium border border-brand-blue/20">
                      Inactive
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-brand-blue/60">0</span>
                    <ChevronRight className="h-4 w-4 text-brand-blue/60" />
                    <span className="text-2xl font-bold text-brand-blue/60">0</span>
                  </div>
                  <div className="text-xs text-brand-blue/70">
                    Not active yet
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Upgrade Button — gray, inactive */}
          {!isCollapsed && (
            <div className="px-4 pb-4">
              <Button
                disabled
                className="w-full bg-brand-blue/20 text-brand-blue/60 font-semibold rounded-xl cursor-not-allowed hover:bg-brand-blue/20 hover:shadow-none"
              >
                Upgrade to Pro
              </Button>
            </div>
          )}
        </div>

        {/* Fixed Bottom Section */}
        <div className="flex-shrink-0 border-t border-brand-blue-light bg-white">
          {/* Bottom Menu */}
          <div className={cn("px-4 pt-3 pb-3", isCollapsed && "px-2")}>
            <nav className="space-y-1">
              {bottomMenuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <div
                    key={item.href}
                    className="relative group/item [&>*]:after:!content-none [&>*]:after:!hidden"
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center rounded-xl text-sm font-medium transition-all duration-200 group relative border-r-0 after:content-none after:!hidden",
                        isCollapsed
                          ? "justify-center px-2 py-3"
                          : "gap-3 px-4 py-3",
                        isActive
                          ? "bg-brand-blue text-white shadow-md"
                          : "text-brand-blue hover:bg-brand-blue-light hover:text-brand-blue",
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div
                        className={cn(
                          "transition-colors duration-200",
                          isActive
                            ? "text-white"
                            : "text-brand-blue/70 group-hover:text-brand-blue",
                        )}
                      >
                        {item.icon}
                      </div>
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Spacer for collapsed sidebar */}
      <div
        className={cn(
          "hidden lg:block transition-all duration-300",
          isCollapsed ? "w-20" : "w-72",
        )}
      />
    </>
  );
}
