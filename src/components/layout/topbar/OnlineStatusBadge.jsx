import { useEffect, useState } from 'react'

export default function OnlineStatusBadge() {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const setOnlineState = () => setOnline(true)
    const setOfflineState = () => setOnline(false)

    window.addEventListener('online', setOnlineState)
    window.addEventListener('offline', setOfflineState)

    return () => {
      window.removeEventListener('online', setOnlineState)
      window.removeEventListener('offline', setOfflineState)
    }
  }, [])

  return (
    <div
      className={
        online
          ? 'hidden items-center gap-2 rounded-xl border px-3 py-2 text-xs font-extrabold xl:flex'
          : 'hidden items-center gap-2 rounded-xl border px-3 py-2 text-xs font-extrabold xl:flex'
      }
      style={
        online
          ? {
              borderColor: 'rgb(110 231 183 / 0.52)',
              background: 'linear-gradient(180deg, rgb(236 253 245), rgb(220 252 231))',
              color: 'rgb(4 120 87)',
            }
          : {
              borderColor: 'rgb(253 230 138 / 0.7)',
              background: 'linear-gradient(180deg, rgb(255 251 235), rgb(254 243 199))',
              color: 'rgb(161 98 7)',
            }
      }
    >
      <span
        className={
          online ? 'h-2 w-2 rounded-full bg-emerald-500' : 'h-2 w-2 rounded-full bg-amber-500'
        }
      />
      {online ? 'Online' : 'Offline'}
    </div>
  )
}
