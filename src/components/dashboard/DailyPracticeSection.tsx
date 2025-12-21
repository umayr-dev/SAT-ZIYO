"use client";

import { BookOpen, CheckCircle2, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/ui/card";
import { Button } from "@/src/ui/button";

export function DailyPracticeSection() {
  return (
    <div className="mb-8">
      {/* Main Card */}
      <Card className="mb-6 border-2 border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl text-gray-900">
                Daily Practice Questions
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Boost your SAT prep with daily targeted questions
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Card 1 */}
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">
                    1 English + 1 Math
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  Daily targeted practice
                </p>
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    Track Progress
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  Monitor your improvement
                </p>
              </CardContent>
            </Card>

            {/* Card 3 */}
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">
                    Instant Feedback
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  Learn from explanations
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Enable Banner */}
          <div className="bg-blue-600 rounded-lg p-6 flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-lg mb-1">
                Ready to start practicing?
              </h3>
              <p className="text-blue-100 text-sm">
                Enable daily questions to get your personalized practice routine
              </p>
            </div>
            <Button
              className="bg-white text-blue-600 hover:bg-gray-100 font-medium"
            >
              Enable Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

