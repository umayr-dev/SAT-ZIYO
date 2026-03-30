"use client";

import { Bell, Search, User } from "lucide-react";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import Link from "next/link";
import type { UserProfile } from "@/src/types";

interface DashboardHeaderProps {
  user: UserProfile;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="mb-4 sm:mb-6 bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-brand-orange-light">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        {/* Welcome Section */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-brand-orange rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-sm sm:text-base font-bold text-white">{initials}</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              Welcome back, {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-black mt-0.5">
              Ready to ace your SAT? Let&apos;s get started!
            </p>
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
          {/* Search Bar - full width on mobile */}
          <div className="relative flex-1 md:flex-initial md:w-64 min-w-0">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-orange/60" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 w-full bg-brand-orange-50 border-brand-orange-light focus:bg-white focus:border-brand-orange rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all duration-200"
            />
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-brand-blue-light hover:bg-brand-blue-50 border border-brand-blue-light transition-all duration-200 flex-shrink-0"
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-brand-blue" />
            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </Button>

          {/* User Profile */}
          <Link href="/dashboard/settings" className="flex-shrink-0">
            <Button
              variant="ghost"
              className="h-9 sm:h-10 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-brand-blue-light hover:bg-brand-blue-50 border border-brand-blue-light transition-all duration-200 gap-1.5 sm:gap-2"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-brand-blue rounded-md sm:rounded-lg flex items-center justify-center">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-brand-blue">
                Profile
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
