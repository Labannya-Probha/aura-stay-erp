import { normalizeHex } from "./color.utils"

const CACHE_PREFIX = "aeds.logo.palette."

function getCacheKey(src) {
  return `${CACHE_PREFIX}${src || "none"}`
}

function getImageData(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error("Logo source is empty"))
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const size = 64
      canvas.width = size
      canvas.height = size

      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      ctx.clearRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)

      resolve(ctx.getImageData(0, 0, size, size).data)
    }

    img.onerror = () => reject(new Error("Logo could not be loaded for palette extraction"))
    img.src = src
  })
}

function quantize(value) {
  return Math.round(value / 24) * 24
}

function toHex(r, g, b) {
  return `#${[r, g, b]
    .map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase()
}

function scoreColor({ r, g, b, count }) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const saturation = max - min
  const brightness = (r + g + b) / 3

  if (brightness > 244 || brightness < 25) return -1
  if (saturation < 20) return -1

  return count + saturation * 4 - Math.abs(145 - brightness) * 1.2
}

export async function extractLogoPalette(logoUrl) {
  const cached = localStorage.getItem(getCacheKey(logoUrl))
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {
      localStorage.removeItem(getCacheKey(logoUrl))
    }
  }

  const data = await getImageData(logoUrl)
  const buckets = new Map()

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]
    if (alpha < 120) continue

    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    const brightness = (r + g + b) / 3
    if (brightness > 246 || brightness < 20) continue

    const key = `${quantize(r)},${quantize(g)},${quantize(b)}`
    const existing = buckets.get(key) || { r: quantize(r), g: quantize(g), b: quantize(b), count: 0 }
    existing.count += 1
    buckets.set(key, existing)
  }

  const colors = [...buckets.values()]
    .map((color) => ({ ...color, score: scoreColor(color) }))
    .filter((color) => color.score > 0)
    .sort((a, b) => b.score - a.score)

  const palette = {
    primary: normalizeHex(colors[0] ? toHex(colors[0].r, colors[0].g, colors[0].b) : null),
    secondary: normalizeHex(colors[1] ? toHex(colors[1].r, colors[1].g, colors[1].b) : null),
    accent: normalizeHex(colors[2] ? toHex(colors[2].r, colors[2].g, colors[2].b) : null),
    source: "logo",
  }

  localStorage.setItem(getCacheKey(logoUrl), JSON.stringify(palette))
  return palette
}
