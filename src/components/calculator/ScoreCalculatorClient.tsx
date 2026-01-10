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
// Based on Albert.io Digital SAT calculator: https://www.albert.io/blog/sat-score-calculator/
// Standard approach: Total raw scores (Module 1 + Module 2) qo'shiladi va conversion table'dan scaled score olinadi
// Reading & Writing: 0-54 raw score (total) -> 200-800 scaled score
// Math: 0-44 raw score (total) -> 200-800 scaled score
// Albert.io kabi oddiy conversion, lekin adaptive adjustment bilan (ozgina tuzatish)
const digitalSATReadingWritingTable: { [key: number]: number } = {
  0: 200,
  1: 200,
  2: 200,
  3: 210,
  4: 220,
  5: 230,
  6: 240,
  7: 250,
  8: 260,
  9: 270,
  10: 280,
  11: 290,
  12: 300,
  13: 310,
  14: 320,
  15: 330,
  16: 340,
  17: 350,
  18: 360,
  19: 370,
  20: 380,
  21: 390,
  22: 400,
  23: 410,
  24: 420,
  25: 430,
  26: 440,
  27: 450,
  28: 460,
  29: 470,
  30: 480,
  31: 490,
  32: 500,
  33: 510,
  34: 520,
  35: 530,
  36: 540,
  37: 550,
  38: 560,
  39: 570,
  40: 580,
  41: 590,
  42: 600,
  43: 610,
  44: 620,
  45: 630,
  46: 640,
  47: 650,
  48: 660,
  49: 670,
  50: 680,
  51: 690,
  52: 700,
  53: 710,
  54: 800,
};

// Math: 0-44 raw score (total) -> 200-800 scaled score
// Albert.io kabi oddiy conversion table
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
  22: 410,
  23: 420,
  24: 430,
  25: 440,
  26: 450,
  27: 460,
  28: 470,
  29: 480,
  30: 490,
  31: 500,
  32: 510,
  33: 520,
  34: 530,
  35: 540,
  36: 550,
  37: 560,
  38: 570,
  39: 580,
  40: 590,
  41: 600,
  42: 610,
  43: 620,
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

  /**
   * Calculate Reading & Writing score - Albert.io style with ozgina adaptive adjustment
   *
   * Base logic (Albert.io): Total raw score qo'shiladi va conversion table'dan scaled score olinadi
   * Adaptive adjustment (ozgina tuzatish): Module 1 performance'ga qarab ozgina bonus/penalty
   * - Module 1 yaxshi (16+) → ozgina bonus (Module 1'ga ko'proq ball)
   * - Module 1 yomon (<12) → ozgina penalty (Module 2'ga kamroq ball)
   */
  const calculateReadingWritingScore = (
    module1: number,
    module2: number
  ): number => {
    // Step 1: Albert.io kabi - total raw score'ni qo'shamiz va conversion table'dan scaled score olamiz
    const totalRaw = module1 + module2;
    let score = getScoreFromTable(digitalSATReadingWritingTable, totalRaw);

    // Step 2: Ozgina adaptive adjustment (Albert.io'ga qaraganda kamroq)
    // Module 1 performance Module 2'ning qiyinligini belgilaydi
    // "Module 1 da ko'proq yechsa unga ko'proq ball, Module 2'da kamroq ball"

    if (module1 >= 16 && module2 > 0) {
      // Module 1 yaxshi (16+) → Module 2 qiyin → Module 1'ga ozgina bonus
      // Albert.io'ga qaraganda kamroq adjustment
      const bonus = Math.floor((module1 - 15) / 4) * 10; // 16+: +10, 20+: +20, 24+: +30
      score = Math.min(800, score + bonus);
    } else if (module1 < 12 && module2 > module1) {
      // Module 1 yomon (<12) → Module 2 oson → Module 2'ga ozgina penalty
      // Albert.io'ga qaraganda kamroq adjustment
      const penalty = Math.floor((12 - module1) / 4) * 10; // <12: -10, <8: -20, <4: -30
      score = Math.max(200, score - penalty);
    }
    // Module 1 o'rtacha (12-15) → hech qanday adjustment yo'q (Albert.io kabi)

    // Faqat onliklar bo'lishi kerak (10, 20, 30...)
    return Math.round(score / 10) * 10;
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
