import { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PATHS } from '../../../app/paths'

const ACTIONS = [
  { id: 'reservation', label: 'New Reservation', path: '/reservations?tab=new' },
  { id: 'guest', label: 'New Guest', path: '/reservations?tab=guest-crm' },
  { id: 'pos', label: 'POS Order', path: '/restaurant?tab=pos' },
  { id: 'voucher', label: 'Voucher Entry', path: '/accounting/voucher' },
  { id: 'purchase', label: 'Purchase / Inventory', path: '/inventory' },
  { id: 'task', label: 'Task', path: PATHS.TASKS || '/tasks' },
]

export default function QuickCreate() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function go(path) {
    setOpen(false)
    navigate(path)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="aeds-btn-primary hidden items-center gap-2 px-3 py-2 text-xs sm:flex"
      >
        <Plus size={15} />
        New
        <ChevronDown size={13} />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-2xl border bg-white shadow-xl"
            style={{
              borderColor: 'color-mix(in srgb, var(--tenant-border) 88%, transparent)',
              boxShadow: '0 20px 38px rgb(15 23 42 / 0.13)',
            }}
          >
            <div
              className="border-b px-4 py-3"
              style={{
                borderColor: 'color-mix(in srgb, var(--tenant-border) 88%, transparent)',
                background:
                  'linear-gradient(180deg, color-mix(in srgb, var(--tenant-surface) 94%, white), var(--tenant-surface))',
              }}
            >
              <div
                className="text-xs font-black uppercase tracking-wide"
                style={{ color: 'var(--tenant-text-muted)' }}
              >
                Quick Create
              </div>
            </div>
            <div className="p-2">
              {ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => go(action.path)}
                  className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-bold transition"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      'color-mix(in srgb, var(--tenant-primary) 8%, white)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                  style={{ color: 'var(--tenant-text)' }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
