import { useState } from "react"
import { Bell } from "lucide-react"
import { useNavigate } from "react-router-dom"

import NotificationCenterPanel from "../../../modules/notifications/NotificationCenterPanel"
import { useNotificationCenter } from "../../../modules/notifications/useNotificationCenter"

export default function NotificationCenter({ tenantId }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const notificationCenter = useNotificationCenter({
    tenantId,
  })

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
        aria-label="Open notification center"
      >
        <Bell size={17} />

        {notificationCenter.unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
            {notificationCenter.unreadCount > 99
              ? "99+"
              : notificationCenter.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-[80] cursor-default"
          onClick={() => setOpen(false)}
          aria-label="Close notification center"
        />
      )}

      <NotificationCenterPanel
        open={open}
        rows={notificationCenter.rows}
        loading={notificationCenter.loading}
        error={notificationCenter.error}
        onClose={() => setOpen(false)}
        onRead={notificationCenter.readOne}
        onReadAll={notificationCenter.readAll}
        onNavigate={(notification) => {
          setOpen(false)
          if (notification.target_url) {
            navigate(notification.target_url)
          }
        }}
      />
    </div>
  )
}
