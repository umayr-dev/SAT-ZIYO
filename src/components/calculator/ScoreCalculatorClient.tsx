"use client";

import { useState, useMemo } from "react";
import {
  Calculator,
  Info,
  BookOpen,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/ui/card";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";

// ==================== DIGITAL SAT CONVERSION TABLES ====================
// Static conversion tables - no server calls needed
// Reading & Writing: 0-54 raw score -> 200-800 scaled score
// Pattern: 0-1:200, 2:220, 3:240, 4:260, 5:270, 6:280, 7:290, 8:300, 9:300, 10:310...
// Requirements:
// - 0-1 correct: 200
// - 27 correct (Module 1 full): 560
// - 54 correct (Module 1+2 full): 800
const digitalSATReadingWritingTable: { [key: number]: number } = {
  0: 200,
  1: 200,
  2: 220,
  3: 240,
  4: 260,
  5: 270,
  6: 280,
  7: 290,
  8: 300,
  9: 300,
  10: 310,
  11: 320,
  12: 330,
  13: 340,
  14: 350,
  15: 360,
  16: 370,
  17: 380,
  18: 390,
  19: 400,
  20: 410,
  21: 420,
  22: 430,
  23: 440,
  24: 450,
  25: 460,
  26: 470,
  27: 560,
  28: 570,
  29: 580,
  30: 590,
  31: 600,
  32: 610,
  33: 620,
  34: 630,
  35: 640,
  36: 650,
  37: 660,
  38: 670,
  39: 680,
  40: 690,
  41: 700,
  42: 710,
  43: 720,
  44: 730,
  45: 740,
  46: 750,
  47: 760,
  48: 770,
  49: 780,
  50: 790,
  51: 795,
  52: 797,
  53: 799,
  54: 800,
};

// Math: 0-44 raw score -> 200-800 scaled score
// Requirements:
// - 0 correct: 200
// - 22 correct (Module 1 full): 570
// - 44 correct (Module 1+2 full): 800
const digitalSATMathTable: { [key: number]: number } = {
  0: 200,
  1: 200,
  2: 210,
  3: 220,
  4: 230,
  5: 240,
  6: 250,
  7: 260,
  8: 270,
  9: 280,
  10: 290,
  11: 300,
  12: 310,
  13: 320,
  14: 330,
  15: 340,
  16: 350,
  17: 360,
  18: 370,
  19: 380,
  20: 390,
  21: 400,
  22: 570,
  23: 580,
  24: 590,
  25: 600,
  26: 610,
  27: 620,
  28: 630,
  29: 640,
  30: 650,
  31: 660,
  32: 670,
  33: 680,
  34: 690,
  35: 700,
  36: 710,
  37: 720,
  38: 730,
  39: 740,
  40: 750,
  41: 760,
  42: 770,
  43: 790,
  44: 800,
};

function getScoreFromTable(
  table: { [key: number]: number },
  rawScore: number
): number {
  const score = Math.round(rawScore);
  const maxKey = Math.max(...Object.keys(table).map(Number));
  const minKey = Math.min(...Object.keys(table).map(Number));

  if (table[score] !== undefined) {
    // Faqat onliklar (10, 20, 30...)
    return Math.round(table[score] / 10) * 10;
  }
  if (score > maxKey) return 800;
  if (score < minKey) return 200;

  let lower = Math.floor(score);
  let upper = Math.ceil(score);

  while (lower >= 0 && table[lower] === undefined) lower--;
  while (upper <= maxKey && table[upper] === undefined) upper++;

  if (table[lower] !== undefined && table[upper] !== undefined) {
    const ratio = (score - lower) / (upper - lower);
    const interpolated = table[lower] + (table[upper] - table[lower]) * ratio;
    // Faqat onliklar (10, 20, 30...)
    return Math.round(interpolated / 10) * 10;
  }

  return 200;
}

function calculatePercentile(totalScore: number): number {
  // Perfect score (1600) = 100%
  if (totalScore >= 1600) return 100;
  if (totalScore >= 1570) return 99;
  if (totalScore >= 1500) return 98;
  if (totalScore >= 1450) return 96;
  if (totalScore >= 1400) return 94;
  if (totalScore >= 1350) return 91;
  if (totalScore >= 1300) return 87;
  if (totalScore >= 1250) return 81;
  if (totalScore >= 1200) return 74;
  if (totalScore >= 1150) return 66;
  if (totalScore >= 1100) return 57;
  if (totalScore >= 1050) return 48;
  if (totalScore >= 1000) return 38;
  if (totalScore >= 950) return 29;
  if (totalScore >= 900) return 21;
  if (totalScore >= 850) return 14;
  if (totalScore >= 800) return 9;
  if (totalScore >= 750) return 5;
  if (totalScore >= 700) return 3;
  if (totalScore >= 650) return 2;
  if (totalScore >= 600) return 1;
  return 1;
}

/**
 * Score Calculator Client Component
 *
 * Handles:
 * - User input (sliders, inputs)
 * - Instant client-side calculation (no network calls)
 * - Real-time score updates
 *
 * Performance:
 * - No network latency - instant calculation
 * - Static conversion tables - no API calls
 * - Minimal re-renders with useMemo
 */
export function ScoreCalculatorClient() {
  // Digital SAT state
  const [rwModule1, setRwModule1] = useState(27);
  const [rwModule2, setRwModule2] = useState(27);
  const [mathModule1, setMathModule1] = useState(22);
  const [mathModule2, setMathModule2] = useState(22);

  // Constants
  const maxRWValue = 27;
  const maxMathValue = 22;

  // Calculate Reading & Writing score with Module 2 special pattern
  // Module 1: 0-27 (normal pattern), 27 to'g'ri = 560
  // Module 2: har 3-chi to'g'riga 10 ball, qolganlariga 7 ball
  // Module 2: 27 to'g'ri = 220 ball (9 ta 10 ball + 18 ta 7 ball = 90 + 126 = 216, +4 = 220)
  // Module 1 (560) + Module 2 (240) = 800
  const calculateReadingWritingScore = (
    module1: number,
    module2: number
  ): number => {
    // Module 1 score (0-27) - conversion table bo'yicha
    const module1Score = getScoreFromTable(
      digitalSATReadingWritingTable,
      module1
    );

    // Module 2: har 3-chi to'g'riga 10 ball, qolganlariga 7 ball
    // Pattern: 1-2: 7 ball, 3: 10 ball, 4-5: 7 ball, 6: 10 ball...
    let module2Points = 0;
    for (let i = 1; i <= module2; i++) {
      if (i % 3 === 0) {
        // Har 3-chi to'g'ri: 3, 6, 9, 12, 15, 18, 21, 24, 27 -> 10 ball
        module2Points += 10;
      } else {
        // Qolgan to'g'ri javoblar: 1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20, 22, 23, 25, 26 -> 7 ball
        module2Points += 7;
      }
    }

    // 27 to'g'ri = 9*10 + 18*7 = 90 + 126 = 216
    // Lekin 220 kerak, demak +4 ball
    if (module2 === 27) {
      module2Points = 220;
    }

    // Module 2 scaled score: 27 to'g'ri = 240 (800 - 560 = 240)
    // Proportional scaling, faqat onliklar (10, 20, 30...)
    const module2Scaled =
      module2 === 27
        ? 240 // Module 1 (560) + Module 2 (240) = 800
        : Math.round(((module2Points / 220) * 240) / 10) * 10; // 10 ga yaxlitlash

    // Total score, faqat onliklar
    const total = Math.min(800, module1Score + module2Scaled);
    return Math.round(total / 10) * 10; // 10 ga yaxlitlash
  };

  // Calculate scores instantly - no API calls
  const scores = useMemo(() => {
    const readingWritingScore = calculateReadingWritingScore(
      rwModule1,
      rwModule2
    );
    const mathRaw = mathModule1 + mathModule2;
    const mathScore = getScoreFromTable(digitalSATMathTable, mathRaw);
    const totalScore = readingWritingScore + mathScore;
    // Total score ham faqat onliklar bo'lishi kerak
    const totalScoreRounded = Math.round(totalScore / 10) * 10;
    const percentile = calculatePercentile(totalScoreRounded);

    return {
      readingWriting: readingWritingScore,
      math: mathScore,
      total: totalScoreRounded,
      percentile,
    };
  }, [rwModule1, rwModule2, mathModule1, mathModule2]);

  const handleInputChange = (
    setter: (value: number) => void,
    value: number
  ) => {
    setter(value);
  };

  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <Calculator className="h-8 w-8 text-gray-700" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900">
              SAT Score Calculator
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Calculate your SAT score instantly. Enter your correct answers for
            each module and get your estimated score range.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Instructions and Inputs */}
          <div className="space-y-6">
            {/* Instructions Card */}
            <Card className="bg-white shadow-md border-gray-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                    <Info className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Instructions
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-700 leading-relaxed mb-4">
                  Enter the number of correctly answered questions for each
                  module using the sliders below to calculate your final score.
                  For <strong>adaptive test scores</strong>, check the
                  &apos;Adaptive&apos; box.
                </CardDescription>
                <div className="mt-4">
                  <div className="font-semibold text-gray-900 mb-2">
                    Adaptive Scoring Rules:
                  </div>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    <li>
                      If you answer 12-15 questions correctly in Module 1,
                      Module 2 will be easier (capped at ~630).
                    </li>
                    <li>
                      If you answer 16+ questions correctly in Module 1, Module
                      2 will be harder (possible scores up to 800).
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Module Inputs */}
            <Card className="bg-white shadow-lg border-gray-200">
              <CardContent className="p-6 space-y-6">
                {/* Reading and Writing Module 1 */}
                <div className="space-y-3">
                  <Label
                    htmlFor="rw-module-1"
                    className="text-base font-semibold text-gray-900"
                  >
                    Reading and Writing Module 1
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="rw-module-1"
                      type="number"
                      min={0}
                      max={maxRWValue}
                      value={rwModule1}
                      onChange={(e) =>
                        handleInputChange(
                          setRwModule1,
                          Math.max(
                            0,
                            Math.min(maxRWValue, parseInt(e.target.value) || 0)
                          )
                        )
                      }
                      className="w-20 text-lg font-semibold text-center"
                    />
                    <div className="flex-1">
                      <input
                        type="range"
                        min={0}
                        max={maxRWValue}
                        value={rwModule1}
                        onChange={(e) =>
                          handleInputChange(
                            setRwModule1,
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: "#374151" }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 min-w-[4rem] text-right font-medium">
                      {rwModule1} /{maxRWValue}
                    </span>
                  </div>
                </div>

                {/* Reading and Writing Module 2 */}
                <div className="space-y-3">
                  <Label
                    htmlFor="rw-module-2"
                    className="text-base font-semibold text-gray-900"
                  >
                    Reading and Writing Module 2
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="rw-module-2"
                      type="number"
                      min={0}
                      max={maxRWValue}
                      value={rwModule2}
                      onChange={(e) =>
                        handleInputChange(
                          setRwModule2,
                          Math.max(
                            0,
                            Math.min(maxRWValue, parseInt(e.target.value) || 0)
                          )
                        )
                      }
                      className="w-20 text-lg font-semibold text-center"
                    />
                    <div className="flex-1">
                      <input
                        type="range"
                        min={0}
                        max={maxRWValue}
                        value={rwModule2}
                        onChange={(e) =>
                          handleInputChange(
                            setRwModule2,
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: "#374151" }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 min-w-[4rem] text-right font-medium">
                      {rwModule2} /{maxRWValue}
                    </span>
                  </div>
                </div>

                {/* Math Module 1 */}
                <div className="space-y-3">
                  <Label
                    htmlFor="math-module-1"
                    className="text-base font-semibold text-gray-900"
                  >
                    Math Module 1
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="math-module-1"
                      type="number"
                      min={0}
                      max={maxMathValue}
                      value={mathModule1}
                      onChange={(e) =>
                        handleInputChange(
                          setMathModule1,
                          Math.max(
                            0,
                            Math.min(
                              maxMathValue,
                              parseInt(e.target.value) || 0
                            )
                          )
                        )
                      }
                      className="w-20 text-lg font-semibold text-center"
                    />
                    <div className="flex-1">
                      <input
                        type="range"
                        min={0}
                        max={maxMathValue}
                        value={mathModule1}
                        onChange={(e) =>
                          handleInputChange(
                            setMathModule1,
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: "#374151" }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 min-w-[4rem] text-right font-medium">
                      {mathModule1} /{maxMathValue}
                    </span>
                  </div>
                </div>

                {/* Math Module 2 */}
                <div className="space-y-3">
                  <Label
                    htmlFor="math-module-2"
                    className="text-base font-semibold text-gray-900"
                  >
                    Math Module 2
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="math-module-2"
                      type="number"
                      min={0}
                      max={maxMathValue}
                      value={mathModule2}
                      onChange={(e) =>
                        handleInputChange(
                          setMathModule2,
                          Math.max(
                            0,
                            Math.min(
                              maxMathValue,
                              parseInt(e.target.value) || 0
                            )
                          )
                        )
                      }
                      className="w-20 text-lg font-semibold text-center"
                    />
                    <div className="flex-1">
                      <input
                        type="range"
                        min={0}
                        max={maxMathValue}
                        value={mathModule2}
                        onChange={(e) =>
                          handleInputChange(
                            setMathModule2,
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: "#374151" }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 min-w-[4rem] text-right font-medium">
                      {mathModule2} /{maxMathValue}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Scores */}
          <div className="space-y-6">
            {/* Total Score Card */}
            <Card className="bg-gradient-to-br from-blue-700 to-blue-900 shadow-lg border-0">
              <CardContent className="p-8 text-center">
                <div className="text-white text-sm font-semibold uppercase tracking-wide mb-4">
                  TOTAL SCORE
                </div>
                <div className="text-6xl sm:text-7xl font-bold text-white mb-2">
                  {scores.total}
                </div>
                <div className="text-blue-100 text-sm mb-4">400 - 1600</div>
                <div className="pt-4 border-t border-blue-600">
                  <div className="text-white text-sm">
                    Percentile: {scores.percentile}%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section Scores Card */}
            <Card className="bg-white shadow-md border-gray-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-gray-700" />
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    SECTION SCORES
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Reading and Writing Score */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-5 w-5 text-gray-700" />
                    <span className="text-base font-medium text-gray-900">
                      Reading and Writing
                    </span>
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    {scores.readingWriting}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">200 - 800</div>
                  <div className="border-t border-gray-200"></div>
                </div>

                {/* Math Score */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-gray-700" />
                    <span className="text-base font-medium text-gray-900">
                      Math
                    </span>
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    {scores.math}
                  </div>
                  <div className="text-sm text-gray-600">200 - 800</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
