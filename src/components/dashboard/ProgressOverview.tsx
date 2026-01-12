"use client";

import { useState, useEffect } from "react";
import { Calendar, TrendingUp, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/ui/card";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import Link from "next/link";

// Mock API dates - replace with actual API call
const availableExamDates = [
  { value: "2024-03-09", label: "March 9, 2024" },
  { value: "2024-05-04", label: "May 4, 2024" },
];

export function ProgressOverview() {
  const [targetScore, setTargetScore] = useState("1580");
  const [isEditing, setIsEditing] = useState(false);
  const [tempTargetScore, setTempTargetScore] = useState(targetScore);
  const [examDate, setExamDate] = useState("");

  useEffect(() => {
   
  }, []);

  const handleSave = () => {
    setTargetScore(tempTargetScore);
    setIsEditing(false);
    // Here you would typically save to API
  };

  const handleCancel = () => {
    setTempTargetScore(targetScore);
    setIsEditing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Exam Countdown Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg font-bold text-gray-900">
              Exam Countdown
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Set your official SAT test date to activate a personalized countdown
            timer.
          </p>
          <div className="relative">
            <select
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-200 rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose your exam date</option>
              {availableExamDates.map((date) => (
                <option key={date.value} value={date.value}>
                  {date.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </CardContent>
      </Card>

      {/* Target Score Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg font-bold text-gray-900">
              Your Target Score
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <>
              <p className="text-sm text-gray-600 mb-2">Current Target</p>
              <p className="text-4xl font-bold text-gray-900 mb-4">
                {targetScore}
              </p>
              <p className="text-sm text-gray-600 mb-6">
                This appears on your{" "}
                <Link
                  href="/results"
                  className="text-blue-900 hover:underline font-medium"
                >
                  Results
                </Link>{" "}
                page.
              </p>
              <Button
                onClick={() => setIsEditing(true)}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white"
              >
                Change
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Current Target</p>
                <Input
                  type="number"
                  min="400"
                  max="1600"
                  value={tempTargetScore}
                  onChange={(e) => setTempTargetScore(e.target.value)}
                  className="text-2xl font-bold"
                  placeholder="Enter target score"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-blue-900 hover:bg-blue-800 text-white"
                >
                  Save
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
