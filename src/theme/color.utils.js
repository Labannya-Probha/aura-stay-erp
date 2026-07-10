export function normalizeHex(value) {
  if (!value || typeof value !== "string") return null
  const text = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(text)) return text.toUpperCase()
  if (/^#[0-9a-fA-F]{3}$/.test(text)) {
    return `#${text[1]}${text[1]}${text[2]}${text[2]}${text[3]}${text[3]}`.toUpperCase()
  }
  return null
}

export function hexToRgb(hex) {
  const safe = normalizeHex(hex)
  if (!safe) return null
  return {
    r: parseInt(safe.slice(1, 3), 16),
    g: parseInt(safe.slice(3, 5), 16),
    b: parseInt(safe.slice(5, 7), 16),
  }
}

export function rgbToHex({ r, g, b }) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

export function mix(hexA, hexB, weight = 0.5) {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  if (!a || !b) return normalizeHex(hexA) || normalizeHex(hexB) || "#0F766E"
  return rgbToHex({
    r: a.r * (1 - weight) + b.r * weight,
    g: a.g * (1 - weight) + b.g * weight,
    b: a.b * (1 - weight) + b.b * weight,
  })
}

export function darken(hex, amount = 0.18) {
  return mix(hex, "#000000", amount)
}

export function lighten(hex, amount = 0.18) {
  return mix(hex, "#FFFFFF", amount)
}

export function getReadableText(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return "#FFFFFF"
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
  return yiq >= 145 ? "#0F172A" : "#FFFFFF"
}
