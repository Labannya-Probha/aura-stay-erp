import { useState } from "react"

export default function BrandLogo({ brand = {}, compact = false }) {
  const [failed, setFailed] = useState(false)
  const logoUrl = String(brand.logo || "").trim()

  const size = compact ? "h-12 w-12 p-2" : "h-16 w-16 p-2.5"

  if (!logoUrl || failed) {
    return (
      <div className={`flex ${size} items-center justify-center rounded-2xl bg-white/15 font-black text-white`}>
        A
      </div>
    )
  }

  return (
    <div className={`flex ${size} items-center justify-center overflow-hidden rounded-2xl bg-white shadow-xl`}>
      <img
        src={logoUrl}
        alt={brand.name || "Tenant logo"}
        className="h-full w-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  )
}