import { useEffect, useState } from 'react'
import { getUiDebugSnapshot } from '../../debug/uiDebug'

function summarizeEvents(events = []) {
  return events.slice(0, 5)
}

export default function UiDebugBadge() {
  const [snapshot, setSnapshot] = useState(() => getUiDebugSnapshot())

  useEffect(() => {
    const update = () => setSnapshot(getUiDebugSnapshot())
    window.addEventListener('aeds-ui-debug-update', update)
    return () => window.removeEventListener('aeds-ui-debug-update', update)
  }, [])

  if (!snapshot.enabled) return null

  const recent = summarizeEvents(snapshot.events)

  return (
    <aside className="fixed bottom-16 right-3 z-[70] w-80 rounded-xl border border-amber-300 bg-amber-50/95 p-3 text-xs text-amber-950 shadow-lg backdrop-blur no-print">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-[11px] uppercase tracking-wide">UI Debug</strong>
        <span className="rounded bg-amber-200 px-2 py-0.5 text-[10px] font-semibold">
          debug_ui=1
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded bg-white/80 p-2">
          <div className="text-[10px] uppercase text-amber-700">Network Failures</div>
          <div className="text-sm font-bold">{snapshot.counters.networkFailures}</div>
        </div>
        <div className="rounded bg-white/80 p-2">
          <div className="text-[10px] uppercase text-amber-700">Permission Hidden</div>
          <div className="text-sm font-bold">{snapshot.counters.permissionHidden}</div>
        </div>
      </div>

      <details className="mt-2 rounded bg-white/70 p-2">
        <summary className="cursor-pointer font-semibold">Sidebar visibility</summary>
        <div className="mt-1">
          <div className="font-semibold text-emerald-800">
            Visible: {snapshot.visibleModules.join(', ') || 'none'}
          </div>
          <div className="mt-1 font-semibold text-rose-800">
            Hidden: {snapshot.hiddenModules.join(', ') || 'none'}
          </div>
        </div>
      </details>

      <details className="mt-2 rounded bg-white/70 p-2" open>
        <summary className="cursor-pointer font-semibold">Recent events</summary>
        <ul className="mt-1 space-y-1">
          {recent.length === 0 && <li className="text-[11px] text-amber-700">No events yet.</li>}
          {recent.map((event, index) => (
            <li key={`${event.at}-${index}`} className="rounded bg-white px-2 py-1 text-[11px]">
              <div className="font-semibold">{event.type}</div>
              {event.moduleId && <div>module: {event.moduleId}</div>}
              {event.reason && <div>reason: {event.reason}</div>}
              {event.status ? <div>status: {event.status}</div> : null}
              {event.url && <div className="truncate">url: {event.url}</div>}
              {event.detail && <div className="truncate">detail: {event.detail}</div>}
            </li>
          ))}
        </ul>
      </details>
    </aside>
  )
}
