import { NextRequest, NextResponse } from "next/server";

/**
 * Score Calculator API Route - Server-Side
 *
 * Performance Benefits:
 * - Calculation logic on server (no client JS)
 * - Can be cached
 * - SEO-friendly
 */

// ==================== DIGITAL SAT CONVERSION TABLES ====================
// Albert.io style: M1 + M2 qo'shiladi, keyin conversion table'dan scaled score olinadi
// Reading & Writing: 0-54 raw score (total) -> 200-800 scaled score
// Math: 0-44 raw score (total) -> 200-800 scaled score
// Based on Albert.io Digital SAT calculator: https://www.albert.io/blog/sat-score-calculator/

// Reading & Writing Conversion Table (1D - Total Raw Score -> Scaled Score)
// Albert.io style - more conservative scoring
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
  // 14 + 14 = 28 -> 430 (exact Albert.io value)
  28: 430,
  29: 440,
  30: 450,
  31: 470,
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
  53: 720,
  54: 800,
};

// Math Conversion Table (1D - Total Raw Score -> Scaled Score)
// Albert.io style - more conservative scoring
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
  // 11 + 11 = 22 -> 430 (exact Albert.io value)
  22: 430,
  23: 440,
  24: 450,
  25: 460,
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

/**
 * Get score from 1D conversion table (Albert.io style)
 * M1 + M2 qo'shiladi, keyin conversion table'dan scaled score olinadi
 */
function getScoreFromTable(
  table: { [key: number]: number },
  rawScore: number
): number {
  const score = Math.round(rawScore);
  const maxKey = Math.max(...Object.keys(table).map(Number));
  const minKey = Math.min(...Object.keys(table).map(Number));

  if (table[score] !== undefined) {
    return table[score];
  }
  if (score > maxKey) return table[maxKey] || 800;
  if (score < minKey) return table[minKey] || 200;

  // Interpolation for values between keys
  let lower = Math.floor(score);
  let upper = Math.ceil(score);

  while (lower >= minKey && table[lower] === undefined) lower--;
  while (upper <= maxKey && table[upper] === undefined) upper++;

  if (table[lower] !== undefined && table[upper] !== undefined) {
    const ratio = (score - lower) / (upper - lower);
    return Math.round(table[lower] + (table[upper] - table[lower]) * ratio);
  }

  return table[minKey] || 200;
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rwModule1, rwModule2, mathModule1, mathModule2 } = body;

    // Validate inputs
    if (
      typeof rwModule1 !== "number" ||
      typeof rwModule2 !== "number" ||
      typeof mathModule1 !== "number" ||
      typeof mathModule2 !== "number"
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Calculate Digital SAT scores using Albert.io style
    // M1 + M2 qo'shiladi, keyin conversion table'dan scaled score olinadi
    const readingWritingRaw = rwModule1 + rwModule2;
    const mathRaw = mathModule1 + mathModule2;

    const readingWritingScore = getScoreFromTable(
      digitalSATReadingWritingTable,
      readingWritingRaw
    );
    const mathScore = getScoreFromTable(digitalSATMathTable, mathRaw);
    const totalScore = readingWritingScore + mathScore;
    const percentile = calculatePercentile(totalScore);

    return NextResponse.json({
      readingWriting: readingWritingScore,
      math: mathScore,
      total: totalScore,
      percentile,
    });
  } catch (error) {
    return NextResponse.json({ error: "Calculation failed" }, { status: 500 });
  }
}
