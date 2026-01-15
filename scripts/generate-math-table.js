const fs = require("fs");
const data = JSON.parse(fs.readFileSync("math_table.json", "utf8"));

let output =
  "const digitalSATMath2DTable: { [m1: number]: { [m2: number]: number } } = {\n";
const m1Keys = Object.keys(data)
  .map(Number)
  .sort((a, b) => b - a);

for (const m1 of m1Keys) {
  output += `  ${m1}: {\n`;
  const m2Keys = Object.keys(data[m1])
    .map(Number)
    .sort((a, b) => b - a);
  for (const m2 of m2Keys) {
    output += `    ${m2}: ${data[m1][m2]},\n`;
  }
  output += "  },\n";
}

output += "};";
console.log(output);
