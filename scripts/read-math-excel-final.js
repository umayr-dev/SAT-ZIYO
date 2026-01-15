/**
 * Read Math Excel file - to'g'ri formatda
 * Excel faylda "M2 \\ M1" deb yozilgan, lekin aslida:
 * - Tepadagi row = M1 headers (22, 21, ..., 0)
 * - Chap tomondagi column = M2 headers (22, 21, ..., 0)
 * - table[M1][M2] = score
 */

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const excelFile = path.join(__dirname, "../public/scoring math.xlsx");

console.log(`Reading ${excelFile}...`);

// Read Excel file
const workbook = XLSX.readFile(excelFile, { cellDates: false });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

console.log(`Reading sheet: ${sheetName}`);

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

// Excel faylda "M2 \\ M1" deb yozilgan, lekin aslida:
// Row 0: ['M2 \\ M1', 22, 21, ..., 0] - bu M1 headers (columns)
// Row 1+: [M2_value, score1, score2, ...] - bu M2 row va scores

// M1 headers - tepadagi row (row 0, column 1 dan boshlab)
const m1Headers = data[0].slice(1);

// M2 headers - chap tomondagi column (row 1 dan boshlab, column 0)
const m2Headers = [];
for (let row = 1; row < data.length; row++) {
  m2Headers.push(data[row][0]);
}

console.log(`M1 headers (columns): ${m1Headers.join(", ")}`);
console.log(`M2 headers (rows): ${m2Headers.join(", ")}`);

// Build table: table[M1][M2] = score
const table = {};

for (let row = 1; row < data.length; row++) {
  const m2Val = data[row][0];
  if (m2Val === null || m2Val === undefined) continue;

  const m2Num = Number(m2Val);
  if (isNaN(m2Num)) continue;

  const rowData = data[row];

  for (let col = 1; col < rowData.length; col++) {
    const m1Val = m1Headers[col - 1];
    if (m1Val === null || m1Val === undefined) continue;

    const m1Num = Number(m1Val);
    if (isNaN(m1Num)) continue;

    const score = rowData[col];
    if (score === null || score === undefined) continue;

    const scoreNum = Number(score);
    if (isNaN(scoreNum)) continue;

    if (!table[m1Num]) {
      table[m1Num] = {};
    }
    table[m1Num][m2Num] = scoreNum;
  }
}

// Test: 16-16 va 17-16
console.log("\n=== Test qiymatlar ===");
console.log("16-16 (M1=16, M2=16):", table[16] && table[16][16]);
console.log("17-16 (M1=17, M2=16):", table[17] && table[17][16]);
console.log("0-0 (M1=0, M2=0):", table[0] && table[0][0]);

// Excel fayldan o'qib olgan ma'lumotlar to'g'ri

// Print as JavaScript object (M1 as outer key, M2 as inner key)
console.log("\n// Math 2D Table from Excel (M1 -> M2):");
console.log(
  "const digitalSATMath2DTable: { [m1: number]: { [m2: number]: number } } = {"
);

const m1Keys = Object.keys(table)
  .map(Number)
  .sort((a, b) => b - a);
for (const m1 of m1Keys) {
  console.log(`  ${m1}: {`);
  const m2Keys = Object.keys(table[m1])
    .map(Number)
    .sort((a, b) => b - a);
  for (const m2 of m2Keys) {
    const score = table[m1][m2];
    console.log(`    ${m2}: ${score},`);
  }
  console.log("  },");
}

console.log("};");

// Save as JSON
const jsonFile = path.join(__dirname, "../math_table_final.json");
fs.writeFileSync(jsonFile, JSON.stringify(table, null, 2));
console.log(`\nTable saved to ${jsonFile}`);
