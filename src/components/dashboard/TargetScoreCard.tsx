"use client";

import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/ui/card";
import { Button } from "@/src/ui/button";

export function TargetScoreCard() {
  return (
    <Card className="h-full border border-gray-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">
            Your Target Score
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">
          You haven&apos;t set a target score yet.
        </p>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
          Set Target Score
        </Button>
      </CardContent>
    </Card>
  );
}
