"use client";

import { BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import Link from "next/link";

export function DailyPracticeCard() {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 via-white to-blue-50 mb-8">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Daily Practice
            </CardTitle>
            <p className="text-gray-600 mt-1">
              Complete today&apos;s practice to maintain your streak
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-gray-700 font-medium">
                2 questions remaining
              </span>
            </div>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <p className="text-sm text-gray-500">Today&apos;s Progress</p>
              <p className="text-lg font-bold text-gray-900">1/3</p>
            </div>
          </div>
          <Link href="/dashboard/practice">
            <Button className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              Continue Practice
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
