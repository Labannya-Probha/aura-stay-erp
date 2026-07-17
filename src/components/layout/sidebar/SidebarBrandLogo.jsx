import { useState } from 'react'

export default function SidebarBrandLogo({ url, softwareName }) {
  const [ok, setOk] = useState(true)

  if (url && ok) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-white/30">
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
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm ring-1 ring-white/30">
      <span className="text-sm font-bold leading-none">{abbr}</span>
    </div>
  )
}
