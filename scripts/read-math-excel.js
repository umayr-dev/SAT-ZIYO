/**
 * Read Math Excel file and generate Math 2D table
 * Requires: npm install xlsx
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelFile = path.join(__dirname, '../public/scoring math.xlsx');

if (!fs.existsSync(excelFile)) {
  console.error(`Error: ${excelFile} not found`);
  process.exit(1);
}

console.log(`Reading ${excelFile}...`);

// Read Excel file
const workbook = XLSX.readFile(excelFile, { cellDates: false });

// Get the first sheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

console.log(`Reading sheet: ${sheetName}`);

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

// Find header row
let headerRow = 0;
for (let i = 0; i < Math.min(10, data.length); i++) {
  const firstCell = data[i] && data[i][0];
  if (firstCell !== null && firstCell !== undefined) {
    headerRow = i;
    break;
  }
}

console.log(`Header row: ${headerRow}`);

// Extract M2 values from header row (skip first column)
const m2Values = [];
const header = data[headerRow] || [];
for (let col = 1; col < header.length; col++) {
  const val = header[col];
  if (val !== null && val !== undefined) {
    const numVal = Number(val);
    if (!isNaN(numVal)) {
      m2Values.push({ col, value: numVal });
    }
  }
}

console.log(`M2 values: ${m2Values.map(v => v.value).join(', ')}`);

// Build table
const table = {};

for (let row = headerRow + 1; row < data.length; row++) {
  const rowData = data[row] || [];
  const m1Cell = rowData[0];
  
  if (m1Cell === null || m1Cell === undefined) continue;
  
  const m1Val = Number(m1Cell);
  if (isNaN(m1Val)) continue;
  
  const m1Row = {};
  for (const { col, value: m2Val } of m2Values) {
    const scoreCell = rowData[col];
    if (scoreCell !== null && scoreCell !== undefined) {
      const score = Number(scoreCell);
      if (!isNaN(score)) {
        m1Row[m2Val] = score;
      }
    }
  }
  
  if (Object.keys(m1Row).length > 0) {
    table[m1Val] = m1Row;
  }
}

// Print as JavaScript object
console.log('\n// Math 2D Table from Excel:');
console.log('const digitalSATMath2DTable = {');

const m1Keys = Object.keys(table).map(Number).sort((a, b) => b - a);
for (const m1 of m1Keys) {
  console.log(`  ${m1}: {`);
  const m2Keys = Object.keys(table[m1]).map(Number).sort((a, b) => b - a);
  for (const m2 of m2Keys) {
    const score = table[m1][m2];
    console.log(`    ${m2}: ${score},`);
  }
  console.log('  },');
}

console.log('};');

// Save as JSON
const jsonFile = path.join(__dirname, '../math_table.json');
fs.writeFileSync(jsonFile, JSON.stringify(table, null, 2));
console.log(`\nTable saved to ${jsonFile}`);
console.log(`Total M1 values: ${m1Keys.length}`);

