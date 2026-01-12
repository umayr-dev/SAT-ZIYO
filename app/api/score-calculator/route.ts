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
// Digital SAT (Adaptive) Conversion Tables
const digitalSATReadingWritingTable: { [key: number]: number } = {
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
  44: 630,
  45: 640,
  46: 650,
  47: 660,
  48: 670,
  49: 680,
  50: 690,
  51: 700,
  52: 710,
  53: 730,
  54: 800,
};

const digitalSATMathTable: { [key: number]: number } = {
  0: 200,
  1: 210,
  2: 220,
  3: 230,
  4: 240,
  5: 250,
  6: 260,
  7: 270,
  8: 280,
  9: 290,
  10: 300,
  11: 310,
  12: 320,
  13: 330,
  14: 340,
  15: 350,
  16: 360,
  17: 370,
  18: 380,
  19: 390,
  20: 400,
  21: 410,
  22: 420,
  23: 430,
  24: 440,
  25: 450,
  26: 460,
  27: 470,
  28: 480,
  29: 490,
  30: 500,
  31: 510,
  32: 520,
  33: 530,
  34: 540,
  35: 550,
  36: 560,
  37: 570,
  38: 580,
  39: 590,
  40: 600,
  41: 610,
  42: 620,
  43: 630,
  44: 800,
};

function getScoreFromTable(
  table: { [key: number]: number },
  rawScore: number
): number {
  const score = Math.round(rawScore);
  const maxKey = Math.max(...Object.keys(table).map(Number));
  const minKey = Math.min(...Object.keys(table).map(Number));

  if (table[score] !== undefined) return table[score];
  if (score > maxKey) return 800;
  if (score < minKey) return 200;

  let lower = Math.floor(score);
  let upper = Math.ceil(score);

  while (lower >= 0 && table[lower] === undefined) lower--;
  while (upper <= maxKey && table[upper] === undefined) upper++;

  if (table[lower] !== undefined && table[upper] !== undefined) {
    const ratio = (score - lower) / (upper - lower);
    return Math.round(table[lower] + (table[upper] - table[lower]) * ratio);
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

    // Calculate Digital SAT scores
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
