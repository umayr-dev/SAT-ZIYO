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
    <div className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-brand-orange-light">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Welcome Section – profile name va text blue */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center shadow-sm">
              <span className="text-base font-bold text-white">{initials}</span>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-orange">
              Welcome back, {displayName}
            </h1>
            <p className="text-sm text-black mt-0.5">
              Ready to ace your SAT? Let&apos;s get started!
            </p>
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 md:flex-initial md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-orange/60" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-full bg-brand-orange-50 border-brand-orange-light focus:bg-white focus:border-brand-orange rounded-xl text-sm transition-all duration-200"
            />
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-xl bg-brand-blue-light hover:bg-brand-blue-50 border border-brand-blue-light transition-all duration-200"
          >
            <Bell className="h-5 w-5 text-brand-blue" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </Button>

          {/* User Profile */}
          <Link href="/settings">
            <Button
              variant="ghost"
              className="h-10 px-3 rounded-xl bg-brand-blue-light hover:bg-brand-blue-50 border border-brand-blue-light transition-all duration-200 gap-2"
            >
              <div className="w-7 h-7 bg-brand-blue rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
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
