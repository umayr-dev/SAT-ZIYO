/**
 * Debug script to read Math Excel file and check 16-16 value
 */

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const excelFile = path.join(__dirname, "../public/scoring math.xlsx");

console.log(`Reading ${excelFile}...`);

// Read Excel file
const workbook = XLSX.readFile(excelFile, { cellDates: false });

// Get the first sheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

console.log(`Reading sheet: ${sheetName}`);

// Convert to JSON with all data
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

// Print first 30 rows to see structure
console.log("\n=== First 30 rows ===");
for (let i = 0; i < Math.min(30, data.length); i++) {
  console.log(`Row ${i}:`, JSON.stringify(data[i]));
}

// Try to find 16-16 value
console.log("\n=== Searching for M1=16, M2=16 ===");
for (let row = 0; row < data.length; row++) {
  const rowData = data[row] || [];
  const firstCell = rowData[0];

  // Check if first cell is 16
  if (firstCell === 16 || firstCell === "16") {
    console.log(`\nFound row with M1=16 at row index ${row}:`);
    console.log("Row data:", JSON.stringify(rowData));

    // Check header row to find M2=16 column
    let headerRow = 0;
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const cell = data[i] && data[i][0];
      if (cell === null || cell === undefined || cell === "") {
        headerRow = i;
        break;
      }
    }

    const header = data[headerRow] || [];
    console.log(`\nHeader row (row ${headerRow}):`, JSON.stringify(header));

    // Find column index for M2=16
    for (let col = 1; col < header.length; col++) {
      const headerVal = header[col];
      if (headerVal === 16 || headerVal === "16") {
        const score = rowData[col];
        console.log(
          `\n*** FOUND: M1=16, M2=16, Score=${score} (at row ${row}, col ${col}) ***`
        );
      }
    }
  }
}

// Also check if M2=16 is in first row
console.log("\n=== Checking if M2 values are in first row ===");
const firstRow = data[0] || [];
console.log("First row:", JSON.stringify(firstRow));

// Find which row has M1=16
console.log("\n=== All rows with M1=16 ===");
for (let row = 0; row < data.length; row++) {
  const rowData = data[row] || [];
  const firstCell = rowData[0];
  if (firstCell === 16 || firstCell === "16") {
    console.log(
      `Row ${row}:`,
      rowData
        .slice(0, 25)
        .map((v, i) => `[${i}]=${v}`)
        .join(", ")
    );
  }
}
