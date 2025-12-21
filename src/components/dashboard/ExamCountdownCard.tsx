"use client";

import { Calendar, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/ui/card";
import { Input } from "@/src/ui/input";

export function ExamCountdownCard() {
  return (
    <Card className="h-full border border-gray-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">Exam Countdown</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">
          Set your official SAT test date to activate a personalized countdown
          timer.
        </p>
        <div className="relative">
          <Input
            type="text"
            placeholder="Choose your exam date"
            className="pr-10 cursor-pointer"
            readOnly
          />
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
      </CardContent>
    </Card>
  );
}

