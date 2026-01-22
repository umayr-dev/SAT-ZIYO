"use client";

import { BookOpen, ArrowRight, CheckCircle2, PlayCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import Link from "next/link";

export function DailyPracticeCard() {
  return (
    <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden rounded-2xl">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center shadow-sm">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Today&apos;s Progress</span>
              <span className="text-sm font-bold text-gray-900">1 / 3</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-gray-900 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: '33.33%' }}
              >
                <span className="text-xs font-semibold text-white">33%</span>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-900">Remaining</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">2</p>
              <p className="text-xs text-gray-600 mt-1">questions left</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">Time</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">~15</p>
              <p className="text-xs text-gray-600 mt-1">minutes</p>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <PlayCircle className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-semibold text-gray-900">Status</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">1</p>
              <p className="text-xs text-gray-600 mt-1">completed</p>
            </div>
          </div>

          {/* Action Button */}
          <Link href="/dashboard/practice" className="block">
            <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl py-6 text-base font-semibold group">
              Start Practice Session
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
