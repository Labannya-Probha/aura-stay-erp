import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import NotificationCenterPanel from '../../../modules/notifications/NotificationCenterPanel'
import { useNotificationCenter } from '../../../modules/notifications/useNotificationCenter'
import { getTenantId } from '../../../lib/tenant'

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const tenantId = getTenantId()

  const notificationCenter = useNotificationCenter({
    tenantId,
    limit: 20,
  })

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border transition"
        style={{
          borderColor: 'color-mix(in srgb, var(--tenant-border) 88%, transparent)',
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--tenant-surface) 95%, white), var(--tenant-surface))',
          color: 'var(--tenant-text-muted)',
          boxShadow: '0 8px 18px rgb(15 23 42 / 0.06)',
        }}
        aria-label="Open notification center"
      >
        <Bell size={17} />

        {notificationCenter.unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
            {notificationCenter.unreadCount > 99 ? '99+' : notificationCenter.unreadCount}
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
        loading={notificationCenter.loading || notificationCenter.refreshing}
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
