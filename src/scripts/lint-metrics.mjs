import { execSync } from "node:child_process"
import fs from "node:fs"

let output = "[]"

try {
  output = execSync("npx eslint src --format json", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
} catch (error) {
  output = error.stdout?.toString() || "[]"
}

const results = JSON.parse(output)
const counts = {}
const files = []

for (const file of results) {
  const total = file.errorCount + file.warningCount
  if (total > 0) {
    files.push({
      filePath: file.filePath,
      errorCount: file.errorCount,
      warningCount: file.warningCount,
      total,
    })
  }

  for (const msg of file.messages) {
    const rule = msg.ruleId || "unknown"
    counts[rule] = (counts[rule] || 0) + 1
  }
}

fs.mkdirSync("reports", { recursive: true })

const report = {
  date: new Date().toISOString(),
  totalProblems: Object.values(counts).reduce((a, b) => a + b, 0),
  counts,
  files: files.sort((a, b) => b.total - a.total),
}

fs.writeFileSync("reports/lint-metrics.json", JSON.stringify(report, null, 2))

console.log("\nAEDS Lint Metrics")
console.table(counts)
console.log(`\nTotal problems: ${report.totalProblems}`)
