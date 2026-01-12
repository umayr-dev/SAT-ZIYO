"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import Link from "next/link";
import type { UserProfile } from "@/src/types";

interface DashboardHeaderProps {
  user: UserProfile;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const displayName = user?.name || user?.email?.split("@")[0] || "User";

  return (
    <div className="mb-6 bg-white  p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Welcome back, {displayName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 w-64 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-full hover:bg-gray-100"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </Button>
        </div>
      </div>
    </div>
  );
}
