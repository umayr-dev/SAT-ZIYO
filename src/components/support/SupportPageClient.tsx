"use client";

import { MessageSquarePlus, MessageCircle, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { useState } from "react";
import { DashboardSidebar } from "@/src/components/dashboard/DashboardSidebar";
import { useSidebar } from "@/src/components/dashboard/SidebarContext";
import { cn } from "@/lib/utils";

export function SupportPageClient() {
  const [tickets] = useState<any[]>([]); // Empty for now
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-white flex">
      <DashboardSidebar />
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          isCollapsed ? "ml-20" : "ml-64"
        )}
      >
        <div className="pl-2 pr-6 py-12 max-w-4xl">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900 rounded-full mb-4">
              <Target className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-blue-900 mb-2">
              My Support Tickets
            </h1>
            <p className="text-gray-600">
              Track your conversations with our support team.
            </p>
          </div>

          {/* Main Card */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">
                Your Tickets
              </CardTitle>
              <Button className="bg-blue-900 hover:bg-blue-800 text-white">
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    No tickets yet
                  </h3>
                  <p className="text-sm text-gray-600">
                    When you submit an issue, it will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Ticket list would go here */}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
