"use client";

import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/ui/card";
import { Button } from "@/src/ui/button";

export function TargetScoreCard() {
  return (
    <Card className="h-full border border-brand-blue-light">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-brand-blue" />
          </div>
          <CardTitle className="text-xl text-brand-blue">
            Your Target Score
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-brand-blue/80 mb-4">
          You haven&apos;t set a target score yet.
        </p>
        <Button className="bg-brand-blue hover:bg-brand-blue/90 text-white w-full">
          Set Target Score
        </Button>
      </CardContent>
    </Card>
  );
}
