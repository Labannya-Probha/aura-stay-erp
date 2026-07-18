import { useState } from 'react'

export default function SidebarBrandLogo({ url, softwareName }) {
  const [ok, setOk] = useState(true)

  if (url && ok) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/95 p-1.5 shadow-[0_8px_22px_rgba(15,23,42,0.14)]">
        <img
          src={url}
          alt={softwareName || 'Tenant logo'}
          onError={() => setOk(false)}
          className="h-full w-full object-contain"
        />
      </div>
    )
  }

  const abbr = (softwareName || 'AS')
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/95 text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.14)]">
      <span className="text-sm font-black leading-none tracking-tight">{abbr}</span>
    </div>
  )
}
