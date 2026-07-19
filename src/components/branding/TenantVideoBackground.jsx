import { useState } from "react"
import { tenantConfig } from "@/config/tenant.config"

export default function TenantVideoBackground() {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      <div className="absolute inset-0 bg-slate-950" />

      <video
        src={tenantConfig.backgroundVideo}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onCanPlay={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          loaded ? "opacity-45" : "opacity-0"
        }`}
      />

      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-950/75 to-blue-950/80" />
    </>
  )
}
