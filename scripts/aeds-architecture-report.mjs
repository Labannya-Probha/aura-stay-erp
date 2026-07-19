import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const srcRoot = path.join(root, "src")
const outputDir = path.join(root, "reports")
const outputFile = path.join(outputDir, "aeds-v7-architecture-report.json")

const extensions = new Set([".js", ".jsx", ".ts", ".tsx", ".css"])

function walk(directory) {
  if (!fs.existsSync(directory)) return []

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)

    if (entry.isDirectory()) return walk(fullPath)
    if (!extensions.has(path.extname(entry.name))) return []

    return [fullPath]
  })
}

const files = walk(srcRoot)

const report = {
  generatedAt: new Date().toISOString(),
  totalFiles: files.length,
  byTopFolder: {},
  legacyPages: [],
  largeFiles: [],
  duplicateBasenames: [],
}

const basenameMap = new Map()

for (const file of files) {
  const relative = path.relative(root, file).replaceAll("\\", "/")
  const parts = relative.split("/")
  const topFolder = parts[1] || "root"

  report.byTopFolder[topFolder] =
    (report.byTopFolder[topFolder] || 0) + 1

  const lineCount = fs.readFileSync(file, "utf8").split("\n").length

  if (relative.startsWith("src/pages/")) {
    report.legacyPages.push({ file: relative, lines: lineCount })
  }

  if (lineCount > 500) {
    report.largeFiles.push({ file: relative, lines: lineCount })
  }

  const basename = path.basename(file)
  const list = basenameMap.get(basename) || []
  list.push(relative)
  basenameMap.set(basename, list)
}

report.duplicateBasenames = [...basenameMap.entries()]
  .filter(([, locations]) => locations.length > 1)
  .map(([basename, locations]) => ({ basename, locations }))

report.legacyPages.sort((a, b) => b.lines - a.lines)
report.largeFiles.sort((a, b) => b.lines - a.lines)

fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(outputFile, JSON.stringify(report, null, 2))

console.log(`AEDS v7 architecture report written to ${outputFile}`)
console.log(`Source files: ${report.totalFiles}`)
console.log(`Legacy pages: ${report.legacyPages.length}`)
console.log(`Files over 500 lines: ${report.largeFiles.length}`)
