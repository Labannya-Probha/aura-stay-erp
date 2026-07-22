import fs from "node:fs"
import path from "node:path"

function decodeJsonString(raw) {
  return JSON.parse(`"${raw}"`)
}

function checkFile(filePath) {
  const source = fs.readFileSync(filePath, "utf8")
  const errors = []
  const stack = []

  let i = 0
  while (i < source.length) {
    const ch = source[i]

    if (ch === '"') {
      let j = i + 1
      let escaped = false
      let raw = ""

      while (j < source.length) {
        const c = source[j]
        if (escaped) {
          raw += c
          escaped = false
        } else if (c === "\\") {
          raw += c
          escaped = true
        } else if (c === '"') {
          break
        } else {
          raw += c
        }
        j += 1
      }

      if (j >= source.length) {
        errors.push(`Unterminated string at offset ${i}`)
        break
      }

      const top = stack[stack.length - 1]
      if (top?.type === "object" && top.expectingKey) {
        // Look ahead to determine whether this string is a key.
        let k = j + 1
        while (k < source.length && /\s/.test(source[k])) k += 1

        if (source[k] === ":") {
          const decoded = decodeJsonString(raw)
          if (top.keys.has(decoded)) {
            const line = source.slice(0, i).split("\n").length
            errors.push(`Duplicate key \"${decoded}\" at line ${line}`)
          } else {
            top.keys.add(decoded)
          }
          top.expectingKey = false
        }
      }

      i = j + 1
      continue
    }

    if (ch === "{") {
      stack.push({ type: "object", keys: new Set(), expectingKey: true })
      i += 1
      continue
    }

    if (ch === "}") {
      stack.pop()
      const top = stack[stack.length - 1]
      if (top?.type === "object") top.expectingKey = false
      i += 1
      continue
    }

    if (ch === "[") {
      stack.push({ type: "array" })
      i += 1
      continue
    }

    if (ch === "]") {
      stack.pop()
      const top = stack[stack.length - 1]
      if (top?.type === "object") top.expectingKey = false
      i += 1
      continue
    }

    if (ch === ",") {
      const top = stack[stack.length - 1]
      if (top?.type === "object") top.expectingKey = true
      i += 1
      continue
    }

    i += 1
  }

  return errors
}

const files = process.argv.slice(2)

if (!files.length) {
  console.error("Usage: node scripts/check-duplicate-json-keys.mjs <file...>")
  process.exit(1)
}

const allErrors = []
for (const file of files) {
  const absolute = path.resolve(file)
  if (!fs.existsSync(absolute)) {
    allErrors.push(`${file}: file not found`)
    continue
  }
  const errors = checkFile(absolute)
  for (const error of errors) {
    allErrors.push(`${file}: ${error}`)
  }
}

if (allErrors.length > 0) {
  console.error("Duplicate JSON key check failed:")
  for (const error of allErrors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log("Duplicate JSON key check passed.")
