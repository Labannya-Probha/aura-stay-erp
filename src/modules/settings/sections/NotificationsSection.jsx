import { useEffect, useState } from 'react'
import { BellRing, CheckCircle2, Mail, Smartphone } from 'lucide-react'

const STORAGE_KEY = 'aura-notification-settings'

const initialPreferences = {
  emailAlerts: true,
  smsAlerts: false,
  desktopAlerts: true,
  dailyDigest: true,
  reservationAlerts: true,
  billingAlerts: true,
  maintenanceAlerts: false,
  emailAddress: '',
}

export default function NotificationsSection() {
  const [preferences, setPreferences] = useState(initialPreferences)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return

    try {
      const parsed = JSON.parse(raw)
      setPreferences({ ...initialPreferences, ...parsed })
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  }, [preferences])

  const updatePreference = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-forest/10 text-forest">
          <BellRing size={20} />
        </div>
        <div>
          <h2 className="font-display font-semibold text-pine text-lg">Notification preferences</h2>
          <p className="text-sm text-pine/60">
            Choose which alerts you want to receive and where they should appear.
          </p>
        </div>
      </div>

      <div className="card space-y-4 p-4">
        <div className="rounded-xl border border-leaf/30 bg-forest/5 p-4 text-sm text-pine/70">
          <div className="flex items-center gap-2 font-medium text-pine">
            <CheckCircle2 size={16} />
            Preferences are stored locally in this browser for now.
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-start justify-between gap-3 rounded-xl border border-leaf/25 bg-white/70 p-3">
            <div>
              <div className="font-medium text-pine">Email alerts</div>
              <p className="text-sm text-pine/60">Send operational updates by email.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.emailAlerts}
              onChange={(event) => updatePreference('emailAlerts', event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-pine/20"
            />
          </label>

          <label className="flex items-start justify-between gap-3 rounded-xl border border-leaf/25 bg-white/70 p-3">
            <div>
              <div className="font-medium text-pine">SMS alerts</div>
              <p className="text-sm text-pine/60">Receive urgent notifications on mobile.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.smsAlerts}
              onChange={(event) => updatePreference('smsAlerts', event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-pine/20"
            />
          </label>

          <label className="flex items-start justify-between gap-3 rounded-xl border border-leaf/25 bg-white/70 p-3">
            <div>
              <div className="font-medium text-pine">Desktop notifications</div>
              <p className="text-sm text-pine/60">Show in-browser alerts while the app is open.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.desktopAlerts}
              onChange={(event) => updatePreference('desktopAlerts', event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-pine/20"
            />
          </label>

          <label className="flex items-start justify-between gap-3 rounded-xl border border-leaf/25 bg-white/70 p-3">
            <div>
              <div className="font-medium text-pine">Daily digest</div>
              <p className="text-sm text-pine/60">Summarize today’s activity once per day.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.dailyDigest}
              onChange={(event) => updatePreference('dailyDigest', event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-pine/20"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-start justify-between gap-3 rounded-xl border border-leaf/25 bg-white/70 p-3">
            <div>
              <div className="font-medium text-pine">Reservation alerts</div>
              <p className="text-sm text-pine/60">Notify on arrivals, changes, and departures.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.reservationAlerts}
              onChange={(event) => updatePreference('reservationAlerts', event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-pine/20"
            />
          </label>

          <label className="flex items-start justify-between gap-3 rounded-xl border border-leaf/25 bg-white/70 p-3">
            <div>
              <div className="font-medium text-pine">Billing alerts</div>
              <p className="text-sm text-pine/60">Alert on new payments, refunds, or invoices.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.billingAlerts}
              onChange={(event) => updatePreference('billingAlerts', event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-pine/20"
            />
          </label>
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-leaf/25 bg-white/70 p-3">
          <input
            type="checkbox"
            checked={preferences.maintenanceAlerts}
            onChange={(event) => updatePreference('maintenanceAlerts', event.target.checked)}
            className="h-4 w-4 rounded border-pine/20"
          />
          <div>
            <div className="font-medium text-pine">Maintenance alerts</div>
            <p className="text-sm text-pine/60">Keep engineering and housekeeping informed.</p>
          </div>
        </label>

        <div className="rounded-xl border border-leaf/25 bg-white/70 p-3">
          <label className="flex flex-col gap-2 text-sm text-pine/70">
            <span className="font-medium text-pine">Primary email address</span>
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-pine/50" />
              <input
                type="email"
                value={preferences.emailAddress}
                onChange={(event) => updatePreference('emailAddress', event.target.value)}
                placeholder="ops@example.com"
                className="input h-9 flex-1"
              />
            </div>
          </label>
        </div>

        <div className="flex items-center gap-2 text-sm text-pine/60">
          <Smartphone size={15} />
          Active channels:{' '}
          {[
            preferences.emailAlerts && 'Email',
            preferences.smsAlerts && 'SMS',
            preferences.desktopAlerts && 'Desktop',
          ]
            .filter(Boolean)
            .join(', ') || 'None'}
        </div>
      </div>
    </div>
  )
}
